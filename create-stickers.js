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

  var startTime = + new Date();

  var configPath = process.argv[2];

  var tmpImgSuffix = '_tmpImage';

  var ColorUtil = stickerUtil.ColorUtil;

  var fillZ = function(n, digits) {
    var s = '' + n;
    while (s.length < digits) {
      s = '0' + s;
    }
    return s;
  };

  var log = function(msg) {
    var date = new Date();
    var ts = fillZ(date.getFullYear(), 4) +
      '-' + fillZ(date.getMonth() + 1, 2) +
      '-'+ fillZ(date.getDate(), 2) +
      ' '+ fillZ(date.getHours(), 2) +
      ':'+ fillZ(date.getMinutes(), 2) +
      ':'+ fillZ(date.getSeconds(), 2) +
      '.'+ fillZ(date.getMilliseconds(), 3);
    console.log(ts + ' - ' + msg);
  };

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

  var renderSheet = function(sheet, i, numSheets) {

    var renderQrcode = function(qr, pixels,
        negativePattern, image) {

      var list = [];
      var map = {};
      var key = function(r, c) { return r + ':' + c; };
      var qr_ = qrcode(config.typeNumber, config.ecl);
      qr_.addData(qr.data);
      qr_.make();
      var moduleCount = qr_.getModuleCount();
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
      var rects = stickerUtil.getQrDataRects(qr_, getPixelAt, negativePattern);
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
            renderQrcode(qr, layer.pixels, false,
                layer['clipImage' + tmpImgSuffix]);
          });
        }

        if (layer.negativePixels) {
          sticker.qrs.forEach(function(qr) {
            renderQrcode(qr, layer.negativePixels, true);
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
        height="${stickerUtil.mm2pixel(config.paperWidth) + 'px'}"
        viewBox="${'0 0 ' + config.paperWidth + ' ' + config.paperHeight}" >
        ${paperBox}
        ${layers}
      </svg>`, { xmlMode: true });

    applyBgStates(config, target.showGuide, $doc);

    !function() {
      var filename = config.title + '-'  + sheet.id + '.svg';
      log(`output ${filename} (${i + 1} of ${numSheets})`);
      fs.writeFileSync('output/' + filename, $doc.html() );
    }();

    if (artboards) {
      var numAb = artboards.hCount * artboards.vCount;
      if (i % numAb == 0) {

        closeAbFdIfOpened();

        var n = Math.floor(i / numAb);
        var filename = config.title + '-ab-' + fillZ(n, 3) + '.svg';
        artboardsFd = fs.openSync('output/' + filename, 'w');
        var abWidth = config.paperWidth +
          (config.paperWidth + artboards.hGap) * (artboards.hCount - 1);
        var abHeight = config.paperHeight +
          (config.paperHeight + artboards.vGap) * (artboards.vCount - 1);
        fs.writeSync(artboardsFd,
            `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
          width="${stickerUtil.mm2pixel(abWidth) + 'px'}"
          height="${stickerUtil.mm2pixel(abHeight) + 'px'}"
          viewBox="${'0 0 ' + abWidth + ' ' +
            abHeight}" >`);
        /*
        fs.writeSync(artboardsFd,
            `<rect fill='red' stroke='yellow' width="${abWidth}" height="${abHeight}" />`);
        */
      }

      var x = (i % artboards.hCount) *
        (config.paperWidth + artboards.hGap);
      var y = (Math.floor(i / artboards.hCount) % artboards.vCount) *
        (config.paperHeight + artboards.vGap);
      $doc(':root').attr({ x: x + 'px', y: y + 'px',
        width: config.paperWidth + 'px', height: config.paperHeight + 'px' });
      fs.writeSync(artboardsFd, $doc.html() );
    }
  };

  var closeAbFdIfOpened = function() {
    if (artboardsFd !== null) {
      fs.writeSync(artboardsFd, `</svg>\n`);
      fs.closeSync(artboardsFd);
      artboardsFd = null;
    }
  };

  var renderSheets = function(sheet, i, numSheets) {
    // end loading and start rendering.

    sheets.forEach(function(sheet, i) {
      renderSheet(sheet, i, sheets.length);
    });

    closeAbFdIfOpened();

    var endTime = + new Date();
    log('output done (' + sheets.length +
        ' sheets in ' + (endTime - startTime) + 'ms)');
  };

  var loadResource = function(path, loadHandler) {
    loadHandler(fs.readFileSync(baseDir + path, 'UTF-8') );
  };

  var target = { showGuide: true };
  stickerUtil.loadConfig(target, loadResource, configPath);
  var config = target.config;
  config.title = config.title.replace(/^\s+|\s+$/g, '') || 'stickers';

  var artboards = config.artboards;
  var artboardsFd = null;

  if (artboards) {
    artboards.hCount = artboards.hCount || 1;
    artboards.vCount = artboards.vCount || 1;
  }

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

  /*!function() {
    // load test
    var strings = [];
    for (var i = 0; i < 1000; i += 1) {
      strings.push('my url#' + i);
    }
    target.strings = strings;
  }();*/

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
      renderSheets();
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
