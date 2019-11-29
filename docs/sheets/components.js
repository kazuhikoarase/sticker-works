// reusable components for Vue.js

'use strict';

!function() {

  var $ = function(e) {
    return {
      on: function(t, l) { e.addEventListener(t, l); return this; },
      off: function(t, l) { e.removeEventListener(t, l); return this; }
    };
  };

  var ColorUtil = function() {
    // https://en.wikipedia.org/wiki/HSL_and_HSV
    var HEX = '0123456789abcdef';
    var hex3Re = /^#[0-9a-f]{3}$/;
    var hex6Re = /^#[0-9a-f]{6}$/;
    var val2hex = function(v) {
      return HEX.charAt( (v >> 4) & 0x0f) + HEX.charAt(v & 0x0f);
    };
    var rgb2hex = function(r, g, b) {
      return '#' + val2hex(r) + val2hex(g) + val2hex(b);
    };
    var hex2val = function(hex, h, l) {
      return HEX.indexOf(hex.charAt(h) ) << 4 |
        HEX.indexOf(hex.charAt(l) );
    };
    var hex2rgb = function(hex) {
      if (typeof hex == 'string') {
        hex = hex.toLowerCase();
        if (hex.match(hex3Re) ) {
          return [ hex2val(hex, 1, 1), hex2val(hex, 2, 2), hex2val(hex, 3, 3) ];
        } else if (hex.match(hex6Re) ) {
          return [ hex2val(hex, 1, 2), hex2val(hex, 3, 4), hex2val(hex, 5, 6) ];
        }
      }
      return [0, 0, 0];
    }
    var coords = [
      [0, 0],
      [Math.PI * 2.00, 360]
    ];
    var lastCoords = coords[coords.length - 1];
    var rad2hue = function(value, reverse) {
      var src = reverse? 1 : 0;
      var dst = reverse? 0 : 1;
      value = value % lastCoords[src];
      if (value < 0) {
        value += lastCoords[src];
      }
      for (var i = 1; i < coords.length; i += 1) {
        var c1 = coords[i - 1];
        var c2 = coords[i];
        if (c1[src] <= value && value < c2[src]) {
          return (value - c1[src]) / (c2[src] - c1[src]) * (c2[dst] - c1[dst]) + c1[dst];
        }
      }
      return 0;
    };

    //
    var unit2ff = function(v) { return Math.floor(v * 255); };
    var ff2unit = function(v) { return v / 255; };
    //
    var hsl2rgb = function(h, s, l) {
      h = h < 0 ? h % 360 + 360 : h % 360;
      var c = (1 - Math.abs(2 * l - 1) ) * s;
      var hh = h / 60;
      var x = c * (1 - Math.abs(hh % 2 - 1));
      var a = hh < 1 ? [c, x, 0] : hh < 2 ? [x, c, 0] :
        hh < 3 ? [0, c, x] : hh < 4 ? [0, x, c] :
        hh < 5 ? [x, 0, c] : [c, 0, x];
      var m = l - c / 2;
      a[0] = unit2ff(a[0] + m);
      a[1] = unit2ff(a[1] + m);
      a[2] = unit2ff(a[2] + m);
      return a;
    };
    var hsv2rgb = function(h, s, v) {
      h = h < 0 ? h % 360 + 360 : h % 360;
      var c = v * s;
      var hh = h / 60;
      var x = c * (1 - Math.abs(hh % 2 - 1));
      var a = hh < 1 ? [c, x, 0] : hh < 2 ? [x, c, 0] :
        hh < 3 ? [0, c, x] : hh < 4 ? [0, x, c] :
        hh < 5 ? [x, 0, c] : [c, 0, x];
      var m = v - c;
      a[0] = unit2ff(a[0] + m);
      a[1] = unit2ff(a[1] + m);
      a[2] = unit2ff(a[2] + m);
      return a;
    };
    var rgb2hslv = function(r, g, b, method) {
      r = ff2unit(r);
      g = ff2unit(g);
      b = ff2unit(b);
      var min = Math.min(r, g, b);
      var max = Math.max(r, g, b);
      var h = max == min? 0 : max == r?
          60 * (0 + (g - b) / (max - min) ) : max == g?
          60 * (2 + (b - r) / (max - min) ) :
          60 * (4 + (r - g) / (max - min) );
      if (h < 0) {
        h += 360;
      }
      var s;
      if (method == 'hsl') {
        s = max == 0? 0 : min == 1? 0 :
          (max - min) / (1 - Math.abs(max + min - 1) );
        var l = (max + min) / 2;
        return [h, s, l];
      } else if (method == 'hsv') {
        s = max == 0? 0 : (max - min) / max;
        var v = max;
        return [h, s, v];
      } else {
        return [0, 0, 0];
      }
    };
    var rgb2hsl = function(r, g, b) {
      return rgb2hslv(r, g, b, 'hsl');
    };
    var rgb2hsv = function(r, g, b) {
      return rgb2hslv(r, g, b, 'hsv');
    };
    var color2rgb = function() {
      var ctx = null;
      var cache = {};
      return function(color) {
        var rgb = cache[color];
        if (!rgb) {
          if (ctx == null) {
            ctx = document.createElement('canvas').getContext('2d');
            ctx.canvas.width = 1;
            ctx.canvas.height = 1;
          }
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, 1, 1);
          var data = ctx.getImageData(0, 0, 1, 1).data;
          rgb = Object.freeze([ data[0], data[1], data[2], data[3] ]);
          cache[color] = rgb;
        }
        return rgb;
      };
    }();
    return {
      rgb2hex: rgb2hex, hex2rgb: hex2rgb,
      hsl2rgb: hsl2rgb, rgb2hsl: rgb2hsl,
      hsv2rgb: hsv2rgb, rgb2hsv: rgb2hsv,
      color2rgb: color2rgb, rad2hue: rad2hue
    };
  }();

  var components = {};

  components['resizable-border'] = {
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
  };

  components['x-svg'] = {
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
  };

  components['slider'] = {
    template: '<label>' +
      '<input ref="input" type="range" style="vertical-align:middle;width:100px;"' +
        ' :value="str(value)" :min="str(min)" :max="str(max)"' +
        ' @input="inputHandler" />' +
      '<span v-html="label" style="vertical-align:middle;"></span></label>',
    mounted: function() {
    },
    props: {
      min: { default: 0, type: Number },
      max: { default: 10, type: Number },
      value: { default: 5, type: Number },
      label: { default: '', type: String }
    },
    methods: {
      str: function(n) {
        return '' + n;
      },
      inputHandler: function() {
        this.$emit('input', +this.$refs.input.value);
      }
    }
  };

  components['qrcode'] = {
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
        var cacheMap = qrcode.$vueCacheMap ||
          (qrcode.$vueCacheMap = { stat: { callCount: 0, failCount: 0 } });
        var stat = cacheMap.stat;
        var qrDataKey = [this.typeNumber, this.errorCorrectionLevel,
                   this.pixels.join(','), '', this.data].join('\n');
        var qrData = cacheMap[qrDataKey];
        stat.callCount +=1;
        if (!qrData) {
          stat.failCount +=1;
          var qrKey = [this.typeNumber, this.errorCorrectionLevel,
            '', this.data].join('\n');
          var qr = cacheMap[qrKey];
          stat.callCount +=1;
          if (!qr) {
            stat.failCount +=1;
            // cache not found, create new
            qr = qrcode(this.typeNumber, this.errorCorrectionLevel);
            qr.addData(this.data);
            qr.make();
            cacheMap[qrKey] = qr;
          }
          var j = 0;
          var pixels = this.pixels;
          var moduleCount = qr.getModuleCount();
          var ctx = document.createElement('canvas').getContext('2d');
          ctx.canvas.width = ctx.canvas.height = moduleCount;
          var image = ctx.createImageData(moduleCount, moduleCount);
          var index = 0;
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
                var rgbPixel = ColorUtil.color2rgb(pixel);
                image.data[index] = rgbPixel[0];
                image.data[index + 1] = rgbPixel[1];
                image.data[index + 2] = rgbPixel[2];
                image.data[index + 3] = rgbPixel[3];
              }
              index += 4;
            }
          }
          ctx.putImageData(image, 0, 0);
          // put to cache.
          qrData = cacheMap[qrDataKey] = {
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
  };

  components['color-circle'] = {
    template: '<canvas :width="size" :height="size"></canvas>',
    props: {
      size: { default: 100, type: Number },
      brightness: { default: 1, type: Number }
    },
    methods: {
      updateImage: function(size, brightness) {
        var r = size / 2;
        var ctx = this.$el.getContext('2d');
        var image = ctx.createImageData(size, size);
        var data = image.data;
        var i = 0;
        var PI2 = Math.PI * 2;
        var h = 0;
        var s = 1;
        var v = brightness;
        for (var y = 0; y < size; y += 1) {
          for (var x = 0; x < size; x += 1) {
            var px = x - r;
            var py = y - r;
            var pr = Math.sqrt(px * px + py * py);
            if (pr < r) {
              var rad = Math.atan2(-py, px);
              //h = rad * 360 / PI2;
              h = ColorUtil.rad2hue(rad);
              s = pr / r;
              var rgb = ColorUtil.hsv2rgb(h, s, v);
              data[i] = rgb[0];
              data[i + 1] = rgb[1];
              data[i + 2] = rgb[2];
              data[i + 3] = 255;
            }
            i += 4;
          }
        }
        ctx.putImageData(image, 0, 0);
      }
    },
    mounted: function() {
      this.updateImage(this.size, this.brightness);
    }
  };

  components['color-pointer'] = {
    template: '<canvas></canvas>',
    props: {
      width: { default: 50 },
      height: { default: 50 },
      add: { default: true },
      fill: { default: '#ccc' },
      shadow: { default: true }
    },
    watch: { render: function() {} },
    computed: {
      render: function() {
        if (!this.ctx) {
          return [ this.ctx ];
        }

        var ctx = this.ctx;
        ctx.canvas.width = this.width;
        ctx.canvas.height = this.height;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.save();

        ctx.scale(this.width, this.height);
        ctx.scale(1 / this.viewBox[2], 1 / this.viewBox[3]);
        ctx.translate(-this.viewBox[0], -this.viewBox[1]);

        ctx.fillStyle = 'rgba(255,0,0,0)';
        ctx.fillRect(this.viewBox[0], this.viewBox[1],
            this.viewBox[2], this.viewBox[3]);
        this.pointers.forEach(function(p, i) {

          if (!(this.shadow || (i == 1) ) ) {
            return;
          }
          ctx.fillStyle = this.fill;
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.lineCap = 'round';
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.width;
          ctx.beginPath();
          ctx.moveTo(0, -5.5);
          ctx.lineTo(0, -13);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(2, -9);
          ctx.lineTo(6, -9);
          ctx.stroke();

          if (this.add) {
            ctx.beginPath();
            ctx.moveTo(4, -7);
            ctx.lineTo(4, -11);
            ctx.stroke();
          }

        }.bind(this) );
        ctx.restore();

        return [ this.ctx, this.add, this.shadow, this.fill ];
      }
    },
    data: function() {
      return {
        ctx: null,
        viewBox: [-11.5, -16.5, 24, 24],
        pointers : [
          { color: '#fff', width: '3' },
          { color: '#000', width: '1' }
        ]
      };
    },
    mounted: function() {
      if (this.$el && typeof this.$el.getContext == 'function') {
        this.ctx = this.$el.getContext('2d');
      }
    }
  };

  components['color-picker'] = {
    template: '<div>' +
        '<div style="position:relative;display:inline-block;float:left;">' +
          '<color-pointer ref="addPointer" style="display:none;" fill="none"' +
          ' :width="24" :height="24" :add="true"></color-pointer>' +
          '<color-pointer ref="delPointer" style="display:none;" fill="none"' +
          ' :width="24" :height="24" :add="false"></color-pointer>' +
          '<color-circle :size="size" :style="{ margin: margin + \'px\' }"/>' +
          '<svg ref="colorEditor" style="position:absolute;left:0px;top:0px;"' +
          ' @mousedown="picker_mousedownHandler($event)"' +
          ' @mouseover="picker_mouseoverHandler($event)"' +
          ' @mouseout="picker_mouseoverHandler($event)"' +
            ' :width="size + margin * 2" :height="size + margin * 2"' +
            ' :viewBox.camel="viewBox">' +
            '<path v-for="c in colorHandles" :d="pathLine(c.x, c.y)"' +
              ' fill="none" stroke="black" :stroke-dasharray="linked?\'\':\'2\'" />' +
            '<g v-for="c in colorHandles"' +
              ' :transform="\'translate(\' + c.x + \' \' + c.y + \')\'"' +
              ' :x-colorHandle-index="c.i">' +
              '<circle :r="c.r + (c.i == selectedIndex? 3 : 1)' +
              ' + (c.i == overIndex? 1 : 0)"' +
                ' fill="black" stroke="none"/>' +
              '<circle :r="c.r" :fill="colors[c.i]" stroke="white" />' +
            '</g>' +
          '</svg>' +
        '</div>' +
        '<div style="display:inline-block;float:left;">' +
          '<div v-for="c in colorHandles"' +
            ' style="display:inline-block;line-height:1;border:1px solid #000;"' +
          ' @mousedown.prevent @click="setSelectedIndex(c.i)">' +
            '<div :style="colorChooserStyle(c)"></div>' +
          '</div>' +
          '<template v-for="(hs, i) in hsvSliders" >' +
            '<br/><label><input type="range"' +
              ' style="width:100px;vertical-align:middle;"' +
              ' min="0" :max="hs.max" :step="hs.step" :value="hs.value"' +
              ' @input="hsv_inputHandler($event, i)" />' +
            '<span style="vertical-align:middle;">' +
            '{{hs.label}} {{formatNumber(hs.scale * hs.value, 2)}}{{hs.unit}}' +
            '</span></label>' +
          '</template>' +
          '<br/><label><input type="checkbox" v-model="linked" />Linked</label>' +
          '<br/><div v-for="(button, i) in buttonStates"' +
              ' style="margin-right:4px;line-height:1;position:relative;display:inline-block;"' +
              ' @mouseover="button_mouseHandler($event, i)"' +
              ' @mouseout="button_mouseHandler($event, i)"' +
              ' @mousedown="button_mouseHandler($event, i)"' +
              ' @mouseup="button_mouseHandler($event, i)">' +
            '<color-pointer style="position:absolute;left:0px;top:0px;"' +
              ' :width="24" :height="24"' +
              ' :add="i == 0" :shadow="false" fill="#ccc" ></color-pointer>' +
            '<svg width="24" height="24" :viewBox.camel="\'0 0 16 16\'" >' +
              '<rect :opacity="0.2" v-if="buttonOverlay(i)"' +
              ' fill="#0cf" stroke="#00c" x="0.5" y="0.5" width="15" height="15" />' +
            '</svg>' +
          '</div>' +
        '</div>' +
        '<br style="clear:both;"/>' +
      '</div>',
    props: {
      value: { default: ['#f00', '#0f0', '#00f'], type: Array },
      margin: { default: 16, type: Number },
      size: { default: 216, type: Number }
    },
    data: function() {
      return {
        linked: true,
        overIndex: -1,
        selectedIndex: 0,
        colorHandles: [],
        buttonMode: '',
        buttonStates: [
          { down: false, over: false, mode: 'add' },
          { down: false, over: false, mode: 'del' }
        ]
      };
    },
    watch: {
      prepareHandles: function() {},
      buttonMode: function(newVal) {
        this.$refs.colorEditor.style.cursor = newVal?
            this.getCursor(newVal == 'add') : '';
      }
    },
    computed: {
      colors: function() { return this.value; },
      hsvSliders: function() {
        var colorHandle = this.colorHandles[this.selectedIndex];
        var values = colorHandle? colorHandle.hsv : [0, 0, 0];
        return [
          { label: 'H', max: '360', step: '0.1', scale: 1, unit: '°' },
          { label: 'S', max: '1', step: '0.001', scale: 100, unit: '%' },
          { label: 'V', max: '1', step: '0.001', scale: 100, unit: '%' },
        ].map(function(hs, i) {
          hs.value = values[i];
          return hs;
        });
      },
      viewBox: function() {
        var s = this.size / 2 + this.margin;
        return -s + ' ' + -s + ' ' + s * 2 + ' ' + s * 2;
      },
      prepareHandles: function() {
        var r = this.size / 2;
        this.colorHandles = this.colors.map(function(color, i) {
          var rgb = ColorUtil.hex2rgb(color);
          var hsv = ColorUtil.rgb2hsv.apply(null, rgb);
          var t = hsv[0] / 180 * Math.PI;
          var x = Math.cos(t) * r * hsv[1];
          var y = -Math.sin(t) * r * hsv[1];
          return { i: i, x: x, y: y, r: i == 0? 10 : 6, hsv: hsv };
        }.bind(this) );
        return [ this.size, this.colors ];
      }
    },
    methods: {
      getCursor: function(add) {
        var pointer =  add?
            this.$refs.addPointer : this.$refs.delPointer;
        var vb = pointer.viewBox;
        var x = -vb[0] / vb[2] * pointer.width;
        var y = -vb[1] / vb[3] * pointer.height;
        return 'url(' + pointer.$el.toDataURL() + ') ' +
          ~~x + ' ' + ~~y + ', auto';
      },
      formatNumber: function(v, digits) {
        var neg = v < 0;
        if (neg) {
          v = -v;
        }
        for (var i = 0; i < digits; i += 1) {
          v *= 10;
        }
        var s = '' + Math.round(v);
        while (s.length <= digits) {
          s = '0' + s;
        }
        if (digits > 0) {
          s = s.substring(0, s.length - digits) +
            '.' + s.substring(s.length - digits);
        }
        return neg? '-' + s : s;
      },
      pathLine: function(x, y) {
        return 'M0 0L' + x + ' ' + y;
      },
      buttonOverlay: function(i) {
        var state = this.buttonStates[i];
        if (this.buttonMode == state.mode || state.down) {
          return true;
        } else if (state.over) {
          return true;
        }
        return false;
      },
      button_mouseHandler: function(event, i) {
        var state = this.buttonStates[i];
        if (event.type == 'mouseover') {
          state.over = true;
        } else if (event.type == 'mouseout') {
          state.over = false;
        } else if (event.type == 'mousedown') {
          event.preventDefault();
          state.down = true;
        } else if (event.type == 'mouseup') {
          state.down = false;
          this.buttonMode = this.buttonMode != state.mode? state.mode: '';
        }
      },
      hsv_inputHandler: function(event, hsvIndex) {
        var colorHandle = this.colorHandles[this.selectedIndex];
        if (!colorHandle) {
          return;
        }
        var value = +event.target.value;
        var delta = value - colorHandle.hsv[hsvIndex];
        var colors = this.colors.slice();
        colors.forEach(function(_, i) {
          if (colorHandle.i == i || (this.linked && hsvIndex == 0) ) {
            var hsv = this.colorHandles[i].hsv;
            hsv[hsvIndex] += delta;
            var color = ColorUtil.rgb2hex.apply(null,
                ColorUtil.hsv2rgb.apply(null, hsv) );
            colors[i] = color;
          }
        }.bind(this) );
        this.$emit('input', colors);
      },
      picker_mouseoverHandler: function(event) {
        var $el = this.closest(function(elm) {
          return elm.getAttribute('x-colorHandle-index') != null;
        }, event);
        if (!$el) {
          return;
        }
        event.preventDefault();
        var targetIndex = +$el.getAttribute('x-colorHandle-index');
        this.overIndex = event.type == 'mouseover'? targetIndex : -1;
      },
      picker_mousedownHandler: function(event) {
        var $el = this.closest(function(elm) {
          return elm.getAttribute('x-colorHandle-index') != null;
        }, event);
        if (this.buttonMode == 'add') {
          this.picker_mousedownHandler_add_handle(event);
        } else if (this.buttonMode == 'del') {
          if ($el) {
            this.picker_mousedownHandler_del_handle(event, $el);
          }
        } else {
          if ($el) {
            this.picker_mousedownHandler_move_handle(event, $el);
          }
        }
      },
      picker_mousedownHandler_add_handle: function(event) {
        event.preventDefault();
        var r = this.size / 2;
        var x = event.offsetX - r - this.margin;
        var y = event.offsetY - r - this.margin;
        var s = Math.sqrt(x * x + y * y) / r;
        var h = Math.atan2(-y, x) * 180 / Math.PI;
        if (h < 0) {
          h += 360;
        }
        if (s > 1) {
          return;
        }
        var color = ColorUtil.rgb2hex.apply(null,
            ColorUtil.hsv2rgb(h, s, 1) );
        var colors = this.colors.slice();
        colors.push(color);
        this.buttonMode = '';
        this.selectedIndex = colors.length - 1;
        this.$emit('input', colors);
      },
      picker_mousedownHandler_del_handle: function(event, $el) {
        event.preventDefault();
        var targetIndex = +$el.getAttribute('x-colorHandle-index');
        var colors = [];
        this.colors.forEach(function(color, i) {
          if (targetIndex != i) {
            colors.push(color);
          }
        }.bind(this) );
        this.buttonMode = '';
        this.selectedIndex = 0;
        this.$emit('input', colors);
      },
      picker_mousedownHandler_move_handle: function(event, $el) {

        event.preventDefault();
        var targetIndex = +$el.getAttribute('x-colorHandle-index');
        this.setSelectedIndex(targetIndex);

        var mousemoveHandler = function(event) {
          var deltaX = event.pageX - dragPoint.x;
          var deltaY = event.pageY - dragPoint.y;
          var x = lastPos.x + deltaX;
          var y = lastPos.y + deltaY;
          var r = this.size / 2;
          var h = Math.atan2(-y, x) * 180 / Math.PI;
          if (h < 0) {
            h += 360;
          }
          var s = Math.sqrt(x * x + y * y) / r;
          if (s > 1) {
            s = 1;
          }
          var dh = h - colorHandles[targetIndex].hsv[0];
          var ds = s / colorHandles[targetIndex].hsv[1]; // ratio
          var colors = this.colors.slice();
          colors.forEach(function(_, i) {
            if (colorHandle.i == i || this.linked) {
              var hsv = colorHandles[i].hsv.slice();
              hsv[0] = (hsv[0] + dh) % 360;
              if (colorHandle.i == i) {
                hsv[1] = s;
              } else if (this.linked) {
                hsv[1] = Math.min(hsv[1] * ds, 1);
              }
              var color = ColorUtil.rgb2hex.apply(null,
                  ColorUtil.hsv2rgb.apply(null, hsv) );
              colors[i] = color;
            }
          }.bind(this) );
          this.$emit('input', colors);

        }.bind(this);

        var mouseupandler = function(event) {
          $(document).off('mousemove', mousemoveHandler).
            off('mouseup', mouseupandler);
        }.bind(this);

        var colorHandles = this.colorHandles.slice();
        var colorHandle = colorHandles[targetIndex];
        var lastPos = { x: colorHandle.x, y: colorHandle.y };
        var dragPoint = { x: event.pageX, y: event.pageY };
        $(document).on('mousemove', mousemoveHandler).
          on('mouseup', mouseupandler);
      },
      closest: function(fn, event, root) {
        if (!root) {
          root = event.currentTarget;
        }
        var elm = event.target;
        while (elm != null && elm != root) {
          if (fn(elm) ) {
            return elm;
          }
          elm = elm.parentNode;
        }
        return null;
      },
      setSelectedIndex: function(i) {
        this.selectedIndex = i;
      },
      colorChooserStyle: function(p) {
        return {
          backgroundColor: this.colors[p.i],
          width: '16px',
          height: '16px',
          borderStyle: 'solid',
          borderWidth: '1px',
          borderColor: p.i == this.selectedIndex? 'white' : 'black',
          verticalAlign: 'top',
          display: 'inline-block'
        };
      }
    }
  };

  !function() {
    for (var k in components) {
      Vue.component(k, components[k]);
    }
  }();

}();
