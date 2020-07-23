// sticker util (nodep)

'use strict';

var stickerUtil = function() {
  console.log('stickerUtil #1x');

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
    }
  };
}();
