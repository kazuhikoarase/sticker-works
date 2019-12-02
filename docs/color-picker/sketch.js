new Vue({
  el: '#app',
  data: {
    mode: 'qr',
    bgColor: '#ffffff',
    pixels: [
      "#ff0000",
      "#ffff00",
      "#00ff00",
      "#00ffff",
      "#0000ff",
      "#ff00ff"
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
