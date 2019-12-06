new Vue({
  el: '#app',
  data: {
    mode: 'qr',
    pixels: [
      "#ff0000",
      "#ffff00",
      "#00ff00",
      "#00ffff",
      "#0000ff",
      "#ff00ff"
    ],
    bgColor: '#ffffff',
    displayPixels: [ '#ffffff' ],
    displayBgColor: '#000000',
    fakeCmyk: true,
    mounted: false
  },
  watch: { validate: function() {} },
  computed: {
    validate: function() {
      if (this.mounted) {
        var picker = this.$refs.picker;
        this.displayPixels = this.pixels.map(function(color) {
          return picker.toDisplayColor(color);
        });
        this.displayBgColor =  picker.toDisplayColor(this.bgColor);
      }
      return [ this.mounted, this.pixels, this.bgColor, this.fakeCmyk ];
    }
  },
  methods: {
    inputHandler: function(colors) {
      if (this.mode == 'qr') {
        this.pixels = colors.length > 0? colors : [ '#000000' ];
      } else if (this.mode == 'bg') {
        this.bgColor = colors.length > 0? colors[0] : '#ffffff';
      }
    },
    download_clickHandler: function() {
      var filename = 'colors.svg';
      var content = this.$refs.svgHolder.innerHTML;
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
    }
  },
  mounted:function() {
    this.mounted = true;
  }
});
