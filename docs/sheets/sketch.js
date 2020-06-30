new Vue({
  el: '#app',
  data: {
    appConfig: {},
    configUrl: '',
    config: {},
    strings: [],
    stickerWidth: 0,
    stickerHeight: 0,
    lastState: {},
    grabbing: false,
    layerStates: [],
    bgUpdate: 0,
    showGuide: true,
    colorEditorLayerIndex: -1,
    colorEditorVisible: false,
    colorEditor: {},
    zoomSet: [
      { value: '0.05', label: '5%' },
      { value: '0.1', label: '10%' },
      { value: '0.2', label: '20%' },
      { value: '0.5', label: '50%' },
      { value: '1', label: '100%' },
      { value: '1.5', label: '150%' },
      { value: '2', label: '200%' },
      { value: '4', label: '400%' }
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
    this.loadResource('assets/app-config.json', function(data) {
      var appConfig = JSON.parse(data);
      this.appConfig = appConfig;
      var configUrl = '';
      appConfig.configSet.forEach(function(config) {
        if (config.selected) {
          configUrl = config.url;
        }
      });
      if (!configUrl && appConfig.configSet.length > 0) {
        // select first item.
        configUrl = appConfig.configSet[0].url;
      }
      this.configUrl = configUrl;
    }.bind(this) );
  },
  watch: {
    configUrl: function(newVal) {
      if (!newVal) {
        return;
      }
      this.loadResource(newVal, function(data) {
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
        this.layerStates = config.layers.map(function() {
          return { bgSVG: '' };
        });
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
        config.layers.forEach(function(layer, l) {
          this.loadResource(layer.bgUrl, function(data) {
            this.layerStates[l].bgSVG = data;
          }.bind(this) );
        }.bind(this) );
      }.bind(this) );
    },
    svgBgStyle: function() {}
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
    svgBgStyle: function() {
      var config = this.config;
      var bgStates = [];
      if (this.$refs.layer &&
          config.layers.length == this.$refs.layer.length) {
        this.$refs.layer.forEach(function($layer, l) {
          var i, elms;
          elms = $layer.querySelectorAll('[x-bg-elm]');
          for (i = 0; i < elms.length; i += 1) {
            elms[i].setAttribute('fill', config.layers[l].bgColor);
            elms[i].style.fill = config.layers[l].bgColor;
          }
          if (config.layers[l].guideSelector) {
            elms = $layer.querySelectorAll(config.layers[l].guideSelector);
            for (i = 0; i < elms.length; i += 1) {
              elms[i].style.display = this.showGuide? '' : 'none';
            }
          }
          bgStates.push({
            bgSelector: config.layers[l].bgSelector,
            bgColor: config.layers[l].bgColor,
            guideSelector: config.layers[l].guideSelector });
        }.bind(this) );
      }
      return [ bgStates, this.bgUpdate, this.showGuide ];
    },
    frameStyle: function() {
      var config = this.config;
      return {
        width: config.frameWidth + 'px',
        height: config.frameHeight + 'px',
        overflow: 'auto',
        cursor: this.grabbing? 'grabbing' : 'grab'
      };
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
    frame_mousedownHandler: function(event) {
      // frame grab feature.
      var mousemoveHandler = function(event) {
        target.scrollLeft = dragPoint.left + dragPoint.x - event.pageX;
        target.scrollTop = dragPoint.top + dragPoint.y - event.pageY;
      }.bind(this);
      var mouseupHandler = function(event) {
        document.removeEventListener('mousemove', mousemoveHandler);
        document.removeEventListener('mouseup', mouseupHandler);
        this.grabbing = false;
      }.bind(this);
      event.preventDefault();
      document.addEventListener('mousemove', mousemoveHandler);
      document.addEventListener('mouseup', mouseupHandler);
      var target = event.currentTarget;
      var dragPoint = { x: event.pageX, y: event.pageY,
                      left: target.scrollLeft, top: target.scrollTop };
      this.grabbing = true;
    },
    resizestartHandler: function(event) {
      var config = this.config;
      this.lastState.frameWidth = config.frameWidth;
      this.lastState.frameHeight = config.frameHeight;
    },
    resizemoveHandler: function(event) {
      var dx = 0;
      var dy = 0;
      if (event.dir.indexOf('l') != -1) {
        dx = -event.dx;
      }
      if (event.dir.indexOf('r') != -1) {
        dx = event.dx;
      }
      if (event.dir.indexOf('t') != -1) {
        dy = -event.dy;
      }
      if (event.dir.indexOf('b') != -1) {
        dy = event.dy;
      }
      var config = this.config;
      config.frameWidth = Math.max(0, this.lastState.frameWidth + dx);
      config.frameHeight = Math.max(0, this.lastState.frameHeight + dy);
    },
    svg_loadHandler: function(event, bgSelector) {
      var svg = event.svg;
      if (bgSelector) {
        var bgElms = svg.querySelectorAll(bgSelector);
        for (var i = 0; i < bgElms.length; i += 1) {
          bgElms[i].setAttribute('x-bg-elm', 'x-bg-elm');
        }
        this.bgUpdate = +new Date();
      }
      var viewBox = (svg.getAttribute('viewBox') || '').split(/\s/g);
      if (viewBox.length == 4) {
        var config = this.config;
        [ 'stickerWidth', 'stickerHeight' ].forEach(function(p, i) {
          if (config[p] == 0) {
            var v = +this.pixel2mm(viewBox[2 + i]);
            if (this[p] != v) {
              this[p] = v;
            }
          }
        }.bind(this) );
      }
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
    downloadAll_clickHandler: function() {
      var config = this.config;
      config.title = config.title.replace(/^\s+|\s+$/g, '') || 'stickers';
      var zip = new JSZip();
      this.sheets.forEach(function(sheet, index) {
        var filename = config.title + '-'  + sheet.id + '.svg';
        var content = this.$refs.svgHolder[index].innerHTML;
        // trim white spaces.
        content = content.replace(/^\s+|\s+$/g, '');
        zip.file(filename, content);
      }.bind(this) );
      var filename = config.title + '.zip';
      zip.generateAsync({type: 'blob'})
        .then(function(content) {
          saveAs(content, filename);
        });
    },
    setColorEditorVisible: function(index, colorEditorVisible, apply) {
      if (colorEditorVisible) {
        this.colorEditorLayerIndex = index;
        this.colorEditor.pixels = this.config.layers[index].pixels;
        this.colorEditor.bgColor = this.config.layers[index].bgColor;
      } else {
        if (apply) {
          this.config.layers[index].pixels = this.colorEditor.pixels;
          this.config.layers[index].bgColor = this.colorEditor.bgColor;
        }
      }
      this.colorEditorVisible = colorEditorVisible;
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
