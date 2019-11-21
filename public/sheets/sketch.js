var vm = new Vue({
  el: '#app',
  data: {
    config: {},
    strings: [],
    stickerWidth: 0,
    stickerHeight: 0,
    bgSVG: '',
    zoomSet: [
      { value: '0.05', label: '5%' },
      { value: '0.1', label: '10%' },
      { value: '0.2', label: '20%' },
      { value: '0.5', label: '50%' },
      { value: '1', label: '100%' },
      { value: '1.5', label: '150%' },
      { value: '2', label: '200%' }
    ],
    eclSet: [
      { value: 'L', label: 'L(7%)' },
      { value: 'M', label: 'M(15%)' },
      { value: 'Q', label: 'Q(25%)' },
      { value: 'H', label: 'H(30%)' }
    ],
    dpi: 72 // fixed to 72dpi
  },
  mounted: function() {
    this.loadResource('assets/config.json', function(data) {
      var config = JSON.parse(data);
      this.config = config;
      this.stickerWidth = config.stickerWidth;
      this.stickerHeight = config.stickerHeight;
      // load data for qrcode.
      this.loadResource(config.dataUrl, function(data) {
        this.strings = data.split(/\s+/g).filter(function(line) {
          return line.length > 0; // reject blank line.
        });
      }.bind(this) );
      // load background image.
      this.loadResource(config.bgUrl, function(data) {
        this.bgSVG = data;
      }.bind(this) );
    }.bind(this) );
  },
  computed: {
    sheets : function() {

      var getId = function(i) {
        var id = '' + i;
        while (id.length < 2) {
          id = '0' + id;
        }
        return id;
      };

      var config = this.config;
      var stickerWidth = this.stickerWidth;
      var stickerHeight = this.stickerHeight;
      var size = Math.max(1, this.stickerWidth - config.hQrMargin * 2);

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
      var strings = this.strings.slice(); // copy of strings.
      var x = config.marginLeft;
      var y = config.marginTop;
      var sheets = [];

      while (strings.length > 0) {
        var stickers = [];
        while (strings.length > 0) {
          stickers.push({ data: strings.shift(), x: x, y: y, size: size });
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
    svgHolderStyle: function() {
      return { transform: 'scale(' + this.config.zoom + ')',
              transformOrigin: 'top left' };
    }
  },
  methods: {
    mm2pixel: function(v) {
      return v * this.dpi / 25.4; 
    },
    pixel2mm: function(v) {
      return v * 25.4 / this.dpi; 
    },
    stickerTransform: function(sticker) {
      var transform = 'translate(' + sticker.x + ' ' + sticker.y +')';
      if (this.config.rotate) {
        transform += 'translate(0 ' + this.stickerWidth + ')'
        transform += 'rotate(-90)'
      }
      return transform;
    },
    svg_loadHandler: function(event) {
      var viewBox = (event.svg.getAttribute('viewBox') || '').split(/\s/g);
      if (viewBox.length != 4) {
        return;
      }
      var config = this.config;
      [ 'stickerWidth', 'stickerHeight' ].forEach(function(p, i) {
        if (config[p] == 0) {
          var v = +this.pixel2mm(viewBox[2 + i]);
          if (this[p] != v) {
            this[p] = v;
          }
        }
      }.bind(this) );
    },
    download_clickHandler: function(index, id) {
      var config = this.config;
      config.title = config.title.replace(/^\s+|\s+$/g, '') || 'stickers';
      var filename = config.title + '-'  + id + '.svg';
      var content = this.$refs.svgHolder[index].innerHTML;
      // trim white spaces.
      content = content.replace(/^\s+|\s+$/g, '');
      var dataURL = 'data:image/svg+xml;charset=UTF-8,' +
        encodeURIComponent(content);
      var a = document.createElement('a');
      a.href = dataURL;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
    loadResource: function(url, loadHandler) {
      var xhr = new window.XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if(xhr.readyState == window.XMLHttpRequest.DONE) {
          loadHandler(xhr.responseText);
        }
      };
      xhr.open('GET', url, true);
      xhr.send();
    }
  }
});
