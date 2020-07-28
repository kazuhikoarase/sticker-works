// main sketch

'use strict';

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
    ]
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
      stickerUtil.loadConfig(this, this.loadResource, newVal);
    },
    svgBgStyle: function() {}
  },
  computed: {
    sheets : function() {
      return stickerUtil.getSheets(
          this.config,
          this.stickerWidth,
          this.stickerHeight,
          this.strings.slice() // copy of strings.
      );
    },
    svgBgStyle: function() {
      var bgStates = this.applyBgStates(this.config, this.showGuide, this.$el);
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
    stickerTransform: function(sticker) {
      return stickerUtil.getStickerTransform(this, sticker);
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
      if (this.postLoadSVG(this, this.config, event.svg, bgSelector) ) {
        this.bgUpdate = +new Date();
      }
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
    applyBgStates: function(config, showGuide, doc) {
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
