let Robot = require('robotjs')
let Jimp = require('jimp')
let Settings = require('./settings')

const {parentPort} = require("worker_threads")

const ResX = 256 
const ResY = 144

const FPS = (10 * 8) + 20
const CompressionMode = 1

let Cached = {}

let Request = 0

function RGBtoNBits(bits, r,g,b) {
  var bits = bits / 3
 
  var r = r >> (8 - bits)
  var g = g >> (8 - bits)
  var b = b >> (8 - bits)
 
  return (r | g << bits | b << bits * 2) + 1
}

function ArraysEqual(a, b) {
  if (a.length === b.length) {
      for (var i = 0; i < a.length; i++) {
          if (a[i] !== b[i]) {
              return false;
          }
      }
      return true;
  } else {
      return false;
  }
}

function PixelDifferent(data, index) {
  if (Settings.Compression > 0) {
      return !(data === Cached[index])
  } else {
     return !ArraysEqual(ColorData, Cached[index])
  }

}

function packRGB(r, g, b) {
  return ((r >> 2) << 4) | ((g >> 4) << 2) | (b >> 6);
}
async function run() {
  while (true) {
    Request++
   // console.log('reset')
    
    let Index = 1;
    let Data = {}

     let image = Robot.screen.capture();
     for (let i = 0; i < image.image.length; i++) { // fix image
      if (i % 4 == 0) { //4
        [image.image[i], image.image[i + 2]] = [image.image[i + 2], image.image[i]];
     // [image.image[i+5], image.image[i+5]] = [image.image[i+12], image.image[i-320]]
      }
     }
  
      var jimg = new Jimp(image.width, image.height);
      jimg.bitmap.data = image.image;
      jimg.resize(ResX, ResY);

       Jimp.read(jimg).then(image => {
        var size = 0;
        var normsize = 0;
        var skipped = 0;

        for (var y = 0; y < ResY; y++) {
          for (var x = 0; x < ResX; x++) {
            var pixel = Jimp.intToRGBA(image.getPixelColor(x, y));

            var compressed = get9BitRGB(pixel.r, pixel.g, pixel.b)

           let ColorData = compressed//[pixel.r, pixel.g, pixel.b]
     
            if (typeof Cached[Index] === 'undefined') {
              Cached[Index] = {};
            }
     
            if (Request < 2) {
              Data[Index] = ColorData

              size += 9;
              normsize += 24; // uncompressed: 8 bit per color, rgb -> 24 bits
            } else {
              if (PixelDifferent(ColorData, Index)) {
                Data[Index] = ColorData;
                Cached[Index] = ColorData;

                size += 9;
                normsize += 24;
              } else {
                skipped++;
              }
            }
     
            //console.log(Data[Index])
            Index++;
          }
        //  console.log(Data[1])
        }

        Data["stats"] = {
          ["compressed"]: size,
          ["uncompressed"]: normsize,
          ["skipped"]: skipped
        }

        parentPort.postMessage(Data)
        
      })
      
      //  console.log("post")
      await new Promise(resolve => setTimeout(resolve, (1/FPS) * 1000));
 // console.log(Cached)
  } 
}
run()
