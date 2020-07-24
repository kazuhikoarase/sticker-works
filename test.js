'use strict';

var fs = require('fs');
var jsdom = require("jsdom");
var jimp = require('jimp');
var qrcode = require('qrcode-generator');
var stickerUtil = require('./docs/sheets/sticker-util.js');

var { JSDOM } = jsdom;

!function() {

  var render = function(sheet) {
    var renderQrcode = function(qr) {
      var qr_ = qrcode(config.typeNumber, config.ecl);
      qr_.addData(qr.data);
      qr_.make();
      var imgSize = qr_.getModuleCount();
      layers += `<g ransform="${'translate(' + qr.x + ' ' + qr.y +
        ')scale(' + config.qrSize / imgSize + ')'}" stroke="none">`;
      layers += 'qrhere';
      layers += `</g>`;
    };
    
    var layers = '';
    config.layers.forEach(function(layer, l) {
      layers += `<g class="${'layer-' + l}"
        display="${target.layerStates[l].visible? 'inline' : 'none'}" >`;
      var bgRect = config.showBgBox? `<rect
              width="${target.stickerWidth}" height="${target.stickerHeight}"
              fill="none"
              stroke="black" stroke-width="0.5"></rect>` : ``;
      sheet.stickers.forEach(function(sticker) {
        layers += `<g transform="${stickerUtil.getStickerTransform(target, sticker)}">
         <g>${target.layerStates[l].bgSVG}</g>
         ${bgRect}`;

        sticker.qrs.forEach(function(qr) {
          renderQrcode(qr);
        });

        if (layer.negativePixels) {
          sticker.qrs.forEach(function(qr) {
            renderQrcode(qr);
          });
        }

        
       /*
       `
         <!-- qrcode -->
         <qrcode v-for="qr in sticker.qrs" :data="qr.data"
                 :key="qr.data" :x="qr.x" :y="qr.y"
                 :size="config.qrSize"
                 :type-number="config.typeNumber"
                 :error-correction-level="config.ecl"
                 v-if="layer.pixels || layer.clipImage"
                 :href="layer.clipImage"
                 :pixels="layer.pixels" ></qrcode>
         <qrcode v-for="qr in sticker.qrs" :data="qr.data"
                 :key="qr.data" :x="qr.x" :y="qr.y"
                 :size="config.qrSize"
                 :type-number="config.typeNumber"
                 :error-correction-level="config.ecl"
                 v-if="layer.negativePixels"
                 :pixels="layer.negativePixels"
                 :negative-pattern="true" ></qrcode>
       </g>`;
     */
        layers += `</g>`;
      });
      layers += `</g>`;

    });

    var paperBox = config.showPaperBox?
        `<rect fill="none" stroke="black" stroke-width="0.5"
         width="${config.paperWidth}" height="${config.paperHeight}"></rect>` : ``;

    var paper = `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
      width="${stickerUtil.mm2pixel(config.paperWidth) + 'px'}"
      height="${stickerUtil.mm2pixel(config.paperHeight) + 'px'}"
      viewBox="${'0 0 ' + config.paperWidth + ' ' + config.paperHeight}" >
    ${paperBox}
    ${layers}
    </svg>`;

    var svg = new JSDOM(paper, { contentType: 'application/xml' });
    stickerUtil.getBgStates(config, target.showGuide, svg.window.document);
    paper = svg.serialize();

    fs.writeFileSync('test.svg.xml', paper);
    fs.writeFileSync('test.svg', paper);
  };

  var loadResource = function(path, loadHandler) {
    loadHandler(fs.readFileSync('docs/sheets/' + path, 'UTF-8') );
  };

  var target = { showGuide: true };
  stickerUtil.loadConfig(target, loadResource, 'assets/config4.json');
  //var sheets = stickerUtil//   getSheets : function(config, stickerWidth, stickerHeight, strings) {
  var config = target.config;

  console.log(JSON.stringify(target, null, 2) );

  var imgPaths = [];
  config.layers.forEach(function(layer, l) {
    if (layer.clipImage) {
      imgPaths.push({ target: layer, prop: 'clipImage' });
    }
  });
  console.log(imgPaths);
  jimp.read('docs/sheets/' + config.layers[0].clipImage, function(err, image) {
    var w = image.bitmap.width;
    var h = image.bitmap.height;
    console.log(w + 'x' + h);
    console.log(image.getPixelColor(0,0));
    console.log(jimp.intToRGBA(image.getPixelColor(0,0) ) );
    console.log(jimp.intToRGBA(image.getPixelColor(w - 1, h - 1) ) );
  });

  config.layers.forEach(function(layer, l) {
    var bgSvg = new JSDOM(target.layerStates[l].bgSVG,
        { contentType: 'application/xml' });
    var bgSvgElm = bgSvg.window.document.querySelector('svg');
    stickerUtil.postLoadSVG(target, config, bgSvgElm, layer.bgSelector);
    bgSvgElm.setAttribute('x', '0');
    bgSvgElm.setAttribute('y', '0');
    bgSvgElm.setAttribute('width', '' + target.stickerWidth);
    bgSvgElm.setAttribute('height', '' + target.stickerHeight);
    target.layerStates[l].bgSVG = bgSvg.serialize();
  });

  var sheets = stickerUtil.getSheets(
      target.config,
      target.stickerWidth,
      target.stickerHeight,
      target.strings.slice() // copy of strings.
  );

  render(sheets[0]);

}();

