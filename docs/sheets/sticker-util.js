// sticker util (nodep)

'use strict';

var stickerUtil = function() {

  var dpi = 72 // fixed to 72dpi

  return {
    mm2pixel: function(v) {
      return v * dpi / 25.4; 
    },
    pixel2mm: function(v) {
      return v * 25.4 / dpi; 
    },
    loadConfig: function(target, loadResource, configUrl) {
      loadResource(configUrl, function(data) {
        var config = JSON.parse(data);
        if (!config.layers) {
          var layer = {};
          [ 'bgUrl', 'pixels', 'negativePixels', 'clipImage',
              'bgColor', 'bgSelector', 'guideSelector' ].forEach(function(prop) {
            layer[prop] = config[prop];
            delete config[prop];
          });
          config.layers = [ layer ];
        }
        target.layerStates = config.layers.map(function() {
          return { visible: true, bgSVG: '' };
        });
        target.config = config;
        target.stickerWidth = config.stickerWidth;
        target.stickerHeight = config.stickerHeight;
        // load data for qrcode.
        loadResource(config.dataUrl, function(data) {
          target.strings = data.split(/\s+/g).filter(function(line) {
            return line.length > 0; // reject blank line.
          });
        });
        // load background image.
        config.layers.forEach(function(layer, l) {
          loadResource(layer.bgUrl, function(data) {
            target.layerStates[l].bgSVG = data;
          });
        });
      });
    },
    getStickerTransform: function(target, sticker) {
      var transform = 'translate(' + sticker.x + ' ' + sticker.y +')';
      if (target.config.rotate) {
        transform += 'translate(' + target.stickerHeight + '0)'
        transform += 'rotate(90)'
      }
      return transform;
    },
    postLoadSVG : function(target, config, svg, bgSelector) {
      var bgUpdated = false;
      if (bgSelector) {
        var bgElms = svg.querySelectorAll(bgSelector);
        for (var i = 0; i < bgElms.length; i += 1) {
          bgElms[i].setAttribute('x-bg-elm', 'x-bg-elm');
        }
        bgUpdated = true;
      }
      var viewBox = (svg.getAttribute('viewBox') || '').split(/\s/g);
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
      return bgUpdated;
    },
    getSheets : function(config, stickerWidth, stickerHeight, strings) {

      var getId = function(i) {
        var id = '' + i;
        while (id.length < 2) {
          id = '0' + id;
        }
        return id;
      };

      // if auto calc, temporary set the paper size.
      if (stickerWidth <= 0) {
        stickerWidth = config.paperWidth;
      }
      if (stickerHeight <= 0) {
        stickerHeight = config.paperHeight;
      }

      if (config.rotate) {
        // swap
        var tmpW = stickerWidth;
        stickerWidth = stickerHeight;
        stickerHeight = tmpW;
      }

      // calc position.
      var x = config.marginLeft;
      var y = config.marginTop;
      var sheets = [];

      while (strings.length > 0) {
        var stickers = [];
        while (strings.length > 0) {

          var qrs = [];
          while (strings.length > 0 && qrs.length < config.qrMarginLeft.length) {
            qrs.push({ data: strings.shift(),
                      x: config.qrMarginLeft[qrs.length].coarse +
                        config.qrMarginLeft[qrs.length].fine / 10,
                      y: config.qrMarginTop.coarse +
                        config.qrMarginTop.fine / 10 });
          }

          stickers.push({ qrs: qrs, x: x, y: y });
          x += stickerWidth + config.hGap;
          if (x + stickerWidth >
              config.paperWidth - config.marginRight) {
            // next line.
            x = config.marginLeft;
            y += stickerHeight + config.vGap;
            if (y + stickerHeight >
                config.paperHeight - config.marginBottom) {
              // next sheet.
              y = config.marginTop;
              break;
            }
          }
        }
        sheets.push({ id: getId(sheets.length + 1), stickers: stickers });
      }
      return sheets;
    },
    getBgStates: function(config, showGuide, doc) {
      return (config.layers || []).map(function(layer, l) {
        var layerSelector = '.layer-' + l;
        var i, elms;
        elms = doc.querySelectorAll(layerSelector + ' [x-bg-elm]');
        for (i = 0; i < elms.length; i += 1) {
          elms[i].setAttribute('fill', layer.bgColor);
          elms[i].style.fill = layer.bgColor;
        }
        if (layer.guideSelector) {
          elms = doc.querySelectorAll(layerSelector + ' ' +
              layer.guideSelector);
          for (i = 0; i < elms.length; i += 1) {
            elms[i].style.display = showGuide? '' : 'none';
          }
        }
        return {
          bgSelector: layer.bgSelector,
          bgColor: layer.bgColor,
          guideSelector: layer.guideSelector
        };
      });
    },
    getQrDataRects: function(qr, getPixelAt, negativePattern) {
      var moduleCount = qr.getModuleCount();
      // There are three position probe patterns
      // at fixed position and size.
      var posProbes = [
        { x: 2, y: 2, pixel: null },
        { x: moduleCount - 5, y: 2, pixel: null },
        { x: 2, y: moduleCount - 5, pixel: null }
      ];
      var list = [];
      var map = {};
      var key = function(r, c) { return r + ':' + c; };
      for (var r = 0; r < moduleCount; r += 1) {
        for (var c = 0; c < moduleCount; c += 1) {
          if (qr.isDark(r, c) ^ negativePattern) {
            var pixel = getPixelAt(r, c, moduleCount);
            posProbes.forEach(function(pp) {
              if (pp.x == c && pp.y == r) {
                pp.pixel = pixel; // store left-top pixel
              } else if (pp.x <= c && c < pp.x + 3 &&
                pp.y <= r && r < pp.y + 3) {
                pixel = pp.pixel; // use stored pixel
              }
            });
            list.push({ r: r, c: c, pixel: pixel })
            map[key(r, c)] = true;
          }
        }
      }
      var gap = 0.5;
      var rects = [];
      for (var i = 0; i < list.length; i += 1) {
        var item = list[i];
        var r = item.r;
        var c = item.c;
        var path = '';
        path += 'M' + c + ' ' + r;
        path += 'L' + (c + 1) + ' ' + r;
        if (c + 1 < moduleCount && map[key(r, c + 1)]) {
          path += 'L' + (c + 1 + gap) + ' ' + (r + 0.5);
        }
        path += 'L' + (c + 1) + ' ' + (r + 1);
        if (r + 1 < moduleCount && map[key(r + 1, c)]) {
          path += 'L' + (c + 0.5) + ' ' + (r + 1 + gap);
        }
        path += 'L' + c + ' ' + (r + 1);
        path += 'Z';
        rects.push({ path: path, color: item.pixel});
      }
      return rects;
    }
  };
}();

if (typeof exports === 'object') {
  module.exports = stickerUtil;
}
