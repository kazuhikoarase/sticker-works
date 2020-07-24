'use strict';

var fs = require('fs');
var jsdom = require("jsdom");
var jimp = require('jimp');
var qrcode = require('qrcode-generator');
var stickerUtil = require('./docs/sheets/sticker-util.js');

var { JSDOM } = jsdom;

!function() {

  var baseUrl = 'docs/sheets/';
  var render = function(sheet) {

    var renderQrcode = function(qr, pixels, href) {
      var list = [];
      var map = {};
      var key = function(r, c) { return r + ':' + c; };
      var qr_ = qrcode(config.typeNumber, config.ecl);
      qr_.addData(qr.data);
      qr_.make();
      /*
      var moduleCount = qr_.getModuleCount();
      layers += `<g transform="${'translate(' + qr.x + ' ' + qr.y +
        ')scale(' + config.qrSize / moduleCount + ')'}" stroke="none">`;
      var gap = 0.5;
*/
      var getPixelAt = href?
        function() {
          // grab from image.
        throw 'not implemented';/*
          var ctx = target.imgCtx;
          var width = +ctx.canvas.width;
          var height = +ctx.canvas.height;
          var data = ctx.getImageData(0, 0, width, height).data;
          return function(r, c, moduleCount) {
            var h = Math.floor(height * r / moduleCount);
            var w = Math.floor(width * c / moduleCount);
            var i = (w + h * width) * 4;
            return ColorUtil.rgb2hex(data[i], data[i + 1], data[i + 2]);
          };
          */
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

      var rects = stickerUtil.getQrDataRects(qr_,getPixelAt, false);
  /*    
      for (var r = 0; r < moduleCount; r += 1) {
        for (var c = 0; c < moduleCount; c += 1) {
          if (qr_.isDark(r, c) ) {
            layers += `<path d="M${c} ${r
              }L${c + 1} ${r
              }L${c + 1 + gap} ${r + 0.5
              }L${c + 1} ${r + 1
              }L${c + 0.5} ${r + 1 + gap
              }L${c} ${r + 1
              }Z" fill=""></path>`;
          }
        }
      }
      */
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
            renderQrcode(qr, layer.pixels, layer.clipImage);
          });
        }

        if (layer.negativePixels) {
          sticker.qrs.forEach(function(qr) {
            renderQrcode(qr, layer.negativePixels);
          });
        }

        
       /*
       `
         <!-- qrcode -->
         <qrcode v-for="qr in sticker.qrs" :data="qr.data"
                 :key="qr.data" :x="qr.x" :y="qr.y"
                 :size="config.qrSize"
                 :type-number="config.typeNumber"
                 :error-correction-level="config.ecl"
                 v-if="layer.pixels || layer.clipImage"
                 :href="layer.clipImage"
                 :pixels="layer.pixels" ></qrcode>
         <qrcode v-for="qr in sticker.qrs" :data="qr.data"
                 :key="qr.data" :x="qr.x" :y="qr.y"
                 :size="config.qrSize"
                 :type-number="config.typeNumber"
                 :error-correction-level="config.ecl"
                 v-if="layer.negativePixels"
                 :pixels="layer.negativePixels"
                 :negative-pattern="true" ></qrcode>
       </g>`;
     */
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
    paper = svg.serialize();

    fs.writeFileSync('test.svg.xml', paper);
    fs.writeFileSync('test.svg', paper);
  };

  var loadResource = function(path, loadHandler) {
    loadHandler(fs.readFileSync(baseUrl + path, 'UTF-8') );
  };

  var target = { showGuide: true };
  stickerUtil.loadConfig(target, loadResource, 'assets/config4.json');
  //var sheets = stickerUtil//   getSheets : function(config, stickerWidth, stickerHeight, strings) {
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
  var imgCount = imgPaths.length;
  
  var loagImages = function() {
    if (!imgPaths.length) {
      console.log('load complete/' + imgCount);
      render(sheets[0]);
      return;
    }
    var imgPath = imgPaths.shift();
    var target = imgPath.target;
    var url = baseUrl + target[imgPath.prop];
    console.log('saa', url);
    jimp.read(url, function(err, image) {
      target[imgPath.prop + '_tmpImage'] = image;
      var w = image.bitmap.width;
      var h = image.bitmap.height;
      console.log(w + 'x' + h);
      console.log(image.getPixelColor(0,0));
      console.log(jimp.intToRGBA(image.getPixelColor(0,0) ) );
      console.log(jimp.intToRGBA(image.getPixelColor(w - 1, h - 1) ) );
      loagImages();
    });
  };
  loagImages();



  /*
  console.log('image loaded?');
  var tmpImgPath = 'docs/sheets/' + config.layers[0].clipImage;
  console.log('read for ' + tmpImgPath)
  jimp.read(tmpImgPath, function(err, image) {
    var w = image.bitmap.width;
    var h = image.bitmap.height;
    console.log(w + 'x' + h);
    console.log(image.getPixelColor(0,0));
    console.log(jimp.intToRGBA(image.getPixelColor(0,0) ) );
    console.log(jimp.intToRGBA(image.getPixelColor(w - 1, h - 1) ) );
  });
*/
  

}();

