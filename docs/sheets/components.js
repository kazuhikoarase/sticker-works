// reusable components.

Vue.component('resizable-border', {
  template: '<div></div>',
  props : {
    debug: { default: false },
    enable: { default: '' }
  },
  mounted: function() {
    var elms = [ this.$el ];
    for (var i = 0; i < 7; i += 1) {
      var elm = document.createElement('DIV');
      this.$el.parentNode.appendChild(elm);
      elms.push(elm);
    }
    // 4 0 5
    // 3   1
    // 7 2 6
    var box = '4px';
    var bdr = '2px';
    var bar = '100%';
    var edg = '-1px';
    var styles = [
      { width: bar, height: bdr, left: edg, top: edg, cursor: 'ns-resize' },
      { width: bdr, height: bar, right: edg, top: edg, cursor: 'ew-resize' },
      { width: bar, height: bdr, left: edg, bottom: edg, cursor: 'ns-resize' },
      { width: bdr, height: bar, left: edg, top: edg, cursor: 'ew-resize' },
      { width: box, height: box, left: edg, top: edg, cursor: 'nwse-resize' },
      { width: box, height: box, right: edg, top: edg, cursor: 'nesw-resize ' },
      { width: box, height: box, right: edg, bottom: edg, cursor: 'nwse-resize' },
      { width: box, height: box, left: edg, bottom: edg, cursor: 'nesw-resize ' }
    ];
    var dirs = [ 't', 'r', 'b', 'l', 'lt', 'rt', 'rb', 'lb' ];
    var $ = function(e) {
      return {
        on: function(t, l) { e.addEventListener(t, l); return this; },
        off: function(t, l) { e.removeEventListener(t, l); return this; },
      };
    };
    var opacity = this.debug? '0.5' : '0';
    var vm = this;
    var extend = Vue.util.extend;
    var enable = this.enable? this.enable.split(/[\s,]+/g) : null;
    elms.forEach(function(e, i) {
      extend(e.style, extend(styles[i], {
        position: 'absolute',
        backgroundColor: i < 4? 'red' : 'blue',
        opacity: opacity
      }) );
      if (enable && enable.indexOf(dirs[i]) == -1) {
        e.style.display = 'none';
      }
      $(e).on('mousedown', function(event) {
        var mousemoveHandler = function(event) {
          vm.$emit('resizemove', {
            dir: dirs[i],
            dx: event.pageX - dragPoint.x,
            dy: event.pageY - dragPoint.y
          });
        };
        var mouseupHandler = function(event) {
          $(document).off('mousemove', mousemoveHandler).
            off('mouseup', mouseupHandler);
          document.body.removeChild(block);
          vm.$emit('resizeend', { dir: dirs[i] });
        };
        //
        event.preventDefault();
        $(document).on('mousemove', mousemoveHandler).
          on('mouseup', mouseupHandler);
        var dragPoint = { x: event.pageX, y: event.pageY };
        var block = document.createElement('DIV');
        extend(block.style, {
          position: 'absolute',
          left: document.documentElement.scrollLeft + 'px',
          top: document.documentElement.scrollTop + 'px',
          width: '100%', height: '100%',
          backgroundColor: 'green',
          opacity: opacity,
          cursor: styles[i].cursor,
        });
        document.body.appendChild(block);
        vm.$emit('resizestart', { dir: dirs[i] });
      });
    });
  }
});

Vue.component('x-svg', {
  template: '<g v-html="svg"></g>',
  props: {
    svg: { default: '' },
    x: { default: 0 },
    y: { default: 0 },
    width: { default: 100 },
    height: { default: 100 }
  },
  watch: { layout: function() {} },
  computed: {
    layout: function() {
      this.$nextTick(function() {
        var svg = this.$el? this.$el.firstChild : null;
        if (svg) {
          [ 'x', 'y', 'width', 'height' ].
          forEach(function(p) {
            svg.setAttribute(p, '' + this[p]);
          }.bind(this) );
          this.$emit('load', { svg: svg });
        }
        return svg;
      });
      return [ this.svg, this.x, this.y, this.width, this.height ];
    }
  }
});

Vue.component('slider', {
  template: '<label>' +
    '<div ref="body" @scroll="scrollHandler" class="slider" style="vertical-align:middle;">' +
      '<div ref="content"></div></div>' +
    '<span v-html="label" style="vertical-align:middle;"></span></label>',
  mounted: function() {
    Vue.util.extend(this.$refs.content.style, {
      width: '500px', height: '1px' });
    Vue.util.extend(this.$refs.body.style, {
      display: 'inline-block',
      overflowX: 'scroll', overflowY: 'hidden',
      width: '100px', height: '100px'
    });
    this.$refs.body.style.height = (this.$refs.body.offsetHeight -
                                    this.$refs.body.clientHeight) + 'px';
    this.updateUI(this.value);
  },
  props: {
    min: { default: 0, type: Number },
    max: { default: 10, type: Number },
    value: { default: 5, type: Number },
    label: { default: '', type: String }
  },
  watch: {
    value: function(newVal) {
      this.updateUI(newVal);
    }
  },
  methods: {
    updateUI: function(value) {
      var r1 = this.$refs.content.offsetWidth - this.$refs.body.offsetWidth;
      var r2 = this.max - this.min;
      this.$refs.body.scrollLeft = (value - this.min) * r1 / r2;
    },
    scrollHandler: function() {
      var r1 = this.$refs.content.offsetWidth - this.$refs.body.offsetWidth;
      var r2 = this.max - this.min;
      var value = this.$refs.body.scrollLeft * r2 / r1 + this.min;
      this.$emit('input', Math.round(value * 100) / 100);
    }
  }
});

Vue.component('qrcode', {
  template: '<image xmlns:xlink="http://www.w3.org/1999/xlink"' +
      ' style="image-rendering:pixelated;" :transform="transform"' +
      ' :width="imgSize" :height="imgSize" :xlink:href="url" />',
  props: {
    typeNumber: { default: 0 },
    errorCorrectionLevel: { default: 'L' },
    data: { default: 'hi!' },
    x: { default: 0 },
    y: { default: 0 },
    size: { default: 100 },
    pixels : { default: [ '#666' ] }
  },
  data: function() {
    return { url: '', imgSize: 0 };
  },
  watch: { qrcode: function() {} },
  computed: {
    qrcode: function() {
      var cacheMap = qrcode.$vueCacheMap || (qrcode.$vueCacheMap = {});
      var key = [this.typeNumber, this.errorCorrectionLevel,
                 this.pixels.join(','), '', this.data].join('\n');
      var qrData = cacheMap[key];
      if (!qrData) {
        // cache not found, create new
        var qr = qrcode(this.typeNumber, this.errorCorrectionLevel);
        qr.addData(this.data);
        qr.make();
        var j = 0;
        var pixels = this.pixels;
        var moduleCount = qr.getModuleCount();
        var ctx = document.createElement('canvas').getContext('2d');
        ctx.canvas.width = ctx.canvas.height = moduleCount;
        // There are three position probe patterns
        // at fixed position and size. 
        var posProbes = [
          { x: 2, y: 2, pixel: null },
          { x: moduleCount - 5, y: 2, pixel: null },
          { x: 2, y: moduleCount - 5, pixel: null }
        ];
        for (var r = 0; r < moduleCount; r += 1) {
          for (var c = 0; c < moduleCount; c += 1) {
            if (qr.isDark(r, c) ) {
              var pixel = pixels[j];
              j = (j + 1) % pixels.length;
              posProbes.forEach(function(pp) {
                if (pp.x == c && pp.y == r) {
                  pp.pixel = pixel; // store left-top pixel
                } else if (pp.x <= c && c < pp.x + 3 &&
                  pp.y <= r && r < pp.y + 3) {
                  pixel = pp.pixel; // use stored pixel
                }
              });
              ctx.fillStyle = pixel;
              ctx.fillRect(c, r, 1, 1);
            }
          }
        }
        // put to cache.
        qrData = cacheMap[key] = {
          url: ctx.canvas.toDataURL(), imgSize: moduleCount };
      }
      this.url = qrData.url;
      this.imgSize = qrData.imgSize;
      return [ this.url, this.imgSize ];
    },
    transform: function() {
      if (this.imgSize == 0) {
        return '';
      }
      return 'translate(' + this.x + ' ' + this.y +
        ')scale(' + this.size / this.imgSize + ')';
    }
  }
});
