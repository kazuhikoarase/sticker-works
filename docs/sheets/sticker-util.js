// sticker util (nodep)

'use strict';

var stickerUtil = function() {
  return {
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
    }
  };
}();
