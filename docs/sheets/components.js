// reusable components.

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
  },
  components: {
    xSvg: {
    },
    slider: {
    },
    qrcode: {
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
