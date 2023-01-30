let Settings = require('./settings')

const { parentPort } = require("worker_threads")

let ResX = Settings.Resolution[0]
let ResY = Settings.Resolution[1]

let FPS = Settings.ServerFramesPerTick
let Compression = Settings.Compression

let isActive = false

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

    await yield();
  }
}

run()
