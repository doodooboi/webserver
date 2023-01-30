let Robot = require('robotjs')
let Jimp = require('jimp')
let Settings = require('./settings')

const { parentPort } = require("worker_threads")

let ResX = Settings.Resolution[0]
let ResY = Settings.Resolution[1]

let FPS = Settings.ServerFramesPerTick
let Compression = Settings.Compression

let isActive = false;
let Cached = {}
let Request = 0

function compressRGB(r, g, b) {
  var bits = Compression / 3

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
  if (Compression > 0) {
    return !(data === Cached[index])
  } else {
    return !ArraysEqual(ColorData, Cached[index])
  }

}

async function yield() {
  return new Promise(resolve => setTimeout(resolve, (1 / FPS) * 1000));
}

parentPort.on("message", (data) => {
  console.log(data)

  if (data.type === "update") {
    ResX = data.X || ResX
    ResY = data.Y || ResY
    isActive = data.Active || isActive
    FPS = data.FPS || FPS

    Cached = {}
    Request = 0

    console.table({ X: ResX, Y: ResY, Active: isActive, FPS: FPS })
  } else if (data.type === "retrieve") {
    parentPort.postMessage({
      type: "status",
      data: {X: ResX, Y: ResY, Active: isActive, FPS: FPS}
    })
  }
})

async function run() {
  while (true) {
    if (!isActive) {await yield(); continue; }
    Request++

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
      var comp = 0;
      var uncom = 0;

      for (var y = 0; y < ResY; y++) {
        for (var x = 0; x < ResX; x++) {
          var pixel = Jimp.intToRGBA(image.getPixelColor(x, y));

          var ColorData;

          if (Compression > 0) {
            ColorData = [pixel.r, pixel.g, pixel.b]
          } else {
            ColorData = compressRGB(pixel.r, pixel.g, pixel.b)
          }

          if (typeof Cached[Index] === 'undefined') {
            Cached[Index] = {};
          }

          if (Request < 2) {
            Data[Index] = ColorData

            comp += Compression;
            uncom += 24;
          } else {
            if (PixelDifferent(ColorData, Index)) {
              Data[Index] = ColorData;
              Cached[Index] = ColorData;

              comp += Compression;
              uncom += 24;
            }
          }

          Index++;
        }
      }

      Data["stats"] = {
        ["compressed"]: comp,
        ["uncompressed"]: uncom,
      }

      parentPort.postMessage({
        type: "video",
        data: Data
      })

    })

    await yield();
  }
}

run()
