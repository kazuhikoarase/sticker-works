//
// for standalone sticker creation.
//

'use strict';

var baseDir = __dirname + '/docs/sheets/';

var fs = require('fs');
var cheerio = require("cheerio");
var jimp = require('jimp');
var qrcode = require('qrcode-generator');
var stickerUtil = require(baseDir + 'sticker-util.js');

!function() {

  if (process.argv.length != 3) {
    console.log('config path not specified.');
    console.log('example:');
    console.log('  node create-stickers assets/config.json');
    return;
  }

  var configPath = process.argv[2];

  var tmpImgSuffix = '_tmpImage';

  var ColorUtil = stickerUtil.ColorUtil;

  var postLoadSVG = function(target, config, $svg, bgSelector) {
    if (bgSelector) {
      var $bgs = $svg.find(bgSelector);
      $bgs.attr({ 'x-bg-elm': 'x-bg-elm' });
    }
    var viewBox = ($svg.attr('viewBox') || '').split(/\s/g);
    if (viewBox.length == 4) {
      [ 'stickerWidth', 'stickerHeight' ].forEach(function(p, i) {
        if (config[p] == 0) {
          var v = +stickerUtil.pixel2mm(viewBox[2 + i]);
          if (target[p] != v) {
            target[p] = v;
          }
        }
      });
    }
  };

  var applyBgStates = function(config, showGuide, $svg) {
    return (config.layers || []).map(function(layer, l) {
      var layerSelector = '.layer-' + l;
      var i, $elms;
      $elms = $svg(layerSelector + ' [x-bg-elm]');
      $elms.attr({ fill: layer.bgColor });
      $elms.css({ fill: layer.bgColor });
      if (layer.guideSelector) {
        $elms = $svg(layerSelector + ' ' + layer.guideSelector);
        $elms.css({ display: showGuide? '' : 'none' });
      }
    });
  };

  var render = function(sheet, i, numSheets) {

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
          ')scale(' + size / imgSize + ')'}" stroke="none">`;
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
         width="${config.paperWidth}"
         height="${config.paperHeight}"></rect>` : ``;

    var $doc = cheerio.load(
      `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
        width="${stickerUtil.mm2pixel(config.paperWidth) + 'px'}"
        height="${stickerUtil.mm2pixel(config.paperHeight) + 'px'}"
        viewBox="${'0 0 ' + config.paperWidth + ' ' + config.paperHeight}" >
        ${paperBox}
        ${layers}
      </svg>`, { xmlMode: true });

    applyBgStates(config, target.showGuide, $doc);
    var filename = config.title + '-'  + sheet.id + '.svg';
    console.log(`output ${filename} (${i + 1} of ${numSheets})`);
    outputResult(filename, $doc.html() );
  };

  var outputResult = function(filename, contents) {
    fs.writeFileSync('output/' + filename, contents);
    //fs.writeFileSync('output/' + filename + '.xml', contents);
  };

  var loadResource = function(path, loadHandler) {
    loadHandler(fs.readFileSync(baseDir + path, 'UTF-8') );
  };

  var target = { showGuide: true };
  stickerUtil.loadConfig(target, loadResource, configPath);
  var config = target.config;
  config.title = config.title.replace(/^\s+|\s+$/g, '') || 'stickers';

  config.layers.forEach(function(layer, l) {
    var $doc = cheerio.load(target.layerStates[l].bgSVG,
        { xmlMode: true });
    var $bgSvg = $doc('svg');
    postLoadSVG(target, config, $bgSvg, layer.bgSelector);
    $bgSvg.attr({x: '0', y: '0',
      width: '' + target.stickerWidth,
      height: '' + target.stickerHeight });
    target.layerStates[l].bgSVG = $doc.html();
  });

  /*
  // load test
  !function() {
    var strings = [];
    for (var i = 0; i < 3000; i += 1) {
      strings.push('my url#' + i);
    }
    target.strings = strings;
  }();
  */

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
      // end loading and start rendering.
      sheets.forEach(function(sheet, i) {
        render(sheet, i, sheets.length);
      });
      return;
    }
    var imgPath = imgPaths.shift();
    var target = imgPath.target;
    var url = baseDir + target[imgPath.prop];
    jimp.read(url, function(err, image) {
      target[imgPath.prop + tmpImgSuffix] = image;
      // load next
      loadImages();
    });
  };
  loadImages();

}();
