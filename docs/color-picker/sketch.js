new Vue({
  el: '#app',
  data: {
    mode: 'qr',
    bgColor: '#ffffff',
    pixels: [
      "#ff3c00",
      "#ffc500",
      "#07ff00",
      "#007aff",
      "#2a00ff",
      "#ff00e3"
    ]
  },
  methods: {
    inputHandler(colors) {
      if (this.mode == 'qr') {
        this.pixels = colors.length > 0? colors : [ '#000000' ];
      } else if (this.mode == 'bg') {
        this.bgColor = colors.length > 0? colors[0] : '#ffffff';
      }
    }
  }
});
