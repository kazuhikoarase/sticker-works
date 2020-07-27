'use strict';

var fs = require('fs');
var jsdom = require("jsdom");
var jimp = require('jimp');
var qrcode = require('qrcode-generator');
var stickerUtil = require('./docs/sheets/sticker-util.js');

!function() {

  var configPath = 'assets/config4.json';

  var baseUrl = 'docs/sheets/';

  var tmpImgSuffix = '_tmpImage';

  var { JSDOM } = jsdom;
  var ColorUtil = stickerUtil.ColorUtil;

  var render = function(sheet) {

    var renderQrcode = function(qr, pixels, image) {

      var list = [];
      var map = {};
      var key = function(r, c) { return r + ':' + c; };
      var qr_ = qrcode(config.typeNumber, config.ecl);
      qr_.addData(qr.data);
      qr_.make();

      var getPixelAt = image?
        function() {
          // grab from image.
          var width = image.bitmap.width;
          var height = image.bitmap.height;
          return function(r, c, moduleCount) {
            var y = Math.floor(height * r / moduleCount);
            var x = Math.floor(width * c / moduleCount);
            var rgba = image.getPixelColor(x, y);
            return ColorUtil.rgb2hex(
                (rgba >>> 24) & 0xff,
                (rgba >>> 16) & 0xff,
                (rgba >>> 8) & 0xff);
          };

        }() :
        function() {
          // sequence of pixels.
          var i = 0;
          return function(r, c, moduleCount) {
            var pixel = pixels[i];
            i = (i + 1) % pixels.length;
            return pixel;
          };
        }();

      var size = config.qrSize;
      var imgSize = qr_.getModuleCount();
      layers += `<g transform="${'translate(' + qr.x + ' ' + qr.y +
          ')scale(' + size / imgSize + ')'}">`;
      var rects = stickerUtil.getQrDataRects(qr_, getPixelAt, false);
      rects.forEach(function(rect) {
        layers += `<path d="${rect.path}" fill="${rect.color}"></path>`;
      });
      layers += `</g>`;
    };

    var layers = '';
    config.layers.forEach(function(layer, l) {

      layers += `<g class="${'layer-' + l}"
        display="${target.layerStates[l].visible? 'inline' : 'none'}" >`;

      var bgRect = config.showBgBox? `<rect
              width="${target.stickerWidth}" height="${target.stickerHeight}"
              fill="none"
              stroke="black" stroke-width="0.5"></rect>` : ``;
      sheet.stickers.forEach(function(sticker) {
        layers += `<g transform="${stickerUtil.getStickerTransform(target, sticker)}">
         <g>${target.layerStates[l].bgSVG}</g>
         ${bgRect}`;

        if (layer.pixels || layer.clipImage) {
          sticker.qrs.forEach(function(qr) {
            renderQrcode(qr, layer.pixels, layer['clipImage' + tmpImgSuffix]);
          });
        }

        if (layer.negativePixels) {
          sticker.qrs.forEach(function(qr) {
            renderQrcode(qr, layer.negativePixels);
          });
        }

        layers += `</g>`;
      });

      layers += `</g>`;

    });

    var paperBox = config.showPaperBox?
        `<rect fill="none" stroke="black" stroke-width="0.5"
         width="${config.paperWidth}" height="${config.paperHeight}"></rect>` : ``;

    var paper = `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
      width="${stickerUtil.mm2pixel(config.paperWidth) + 'px'}"
      height="${stickerUtil.mm2pixel(config.paperHeight) + 'px'}"
      viewBox="${'0 0 ' + config.paperWidth + ' ' + config.paperHeight}" >
    ${paperBox}
    ${layers}
    </svg>`;

    var svg = new JSDOM(paper, { contentType: 'application/xml' });
    stickerUtil.getBgStates(config, target.showGuide, svg.window.document);
    var svgText = svg.serialize();

    fs.writeFileSync('output/test.svg.xml', svgText);
    fs.writeFileSync('output/test.svg', svgText);
  };

  var loadResource = function(path, loadHandler) {
    loadHandler(fs.readFileSync(baseUrl + path, 'UTF-8') );
  };

  var target = { showGuide: true };
  stickerUtil.loadConfig(target, loadResource, configPath);
  var config = target.config;

  config.layers.forEach(function(layer, l) {
    var bgSvg = new JSDOM(target.layerStates[l].bgSVG,
        { contentType: 'application/xml' });
    var bgSvgElm = bgSvg.window.document.querySelector('svg');
    stickerUtil.postLoadSVG(target, config, bgSvgElm, layer.bgSelector);
    bgSvgElm.setAttribute('x', '0');
    bgSvgElm.setAttribute('y', '0');
    bgSvgElm.setAttribute('width', '' + target.stickerWidth);
    bgSvgElm.setAttribute('height', '' + target.stickerHeight);
    target.layerStates[l].bgSVG = bgSvg.serialize();
  });

  var sheets = stickerUtil.getSheets(
      target.config,
      target.stickerWidth,
      target.stickerHeight,
      target.strings.slice() // copy of strings.
  );

  var imgPaths = [];
  config.layers.forEach(function(layer, l) {
    if (layer.clipImage) {
      imgPaths.push({ target: layer, prop: 'clipImage' });
    }
  });

  var loadImages = function() {
    if (!imgPaths.length) {
      render(sheets[0]);
      return;
    }
    var imgPath = imgPaths.shift();
    var target = imgPath.target;
    var url = baseUrl + target[imgPath.prop];
    jimp.read(url, function(err, image) {
      target[imgPath.prop + tmpImgSuffix] = image;
      // load next
      loadImages();
    });
  };
  loadImages();

}();
