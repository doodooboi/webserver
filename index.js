require("dotenv").config()

const {Worker} = require("worker_threads") 
const https = require("https")
const fs = require('fs')

const sslOptions = {
  key: fs.readFileSync(__dirname + "/../ssl/priv.key"),
  cert: fs.readFileSync(__dirname + "/../ssl/caca_onthewifi_com.pem-chain")
} // yes queen we have got https:// on 2023-01-28

const express = require('express');
const router = express.Router();
const secured = express.Router()
const public = express();

const Renderer = new Worker("./capture.js")
const Settings = require('./settings');

let Authorized = []

function CheckAuthentication(req, res, next) {
  if (Authorized.includes(req.socket.remoteAddress)) {
    if (next) {next();}

    return true;
  }

  const login = req.body.user
  const password = req.body.pass

  if (login && password && login === process.env.ROOT && password === process.env.ROOTPASSWORD) {
    if (next) {next();}

    Authorized.push(req.socket.remoteAddress)

    return true;
  } else {
    res.status(403).json({response: "NOT-LOGGED-IN"});
  }
}


secured.use(CheckAuthentication)
secured.use(express.urlencoded({ extended: true }));
secured.use(express.json());

public.use(express.urlencoded({ extended: true }));
public.use(express.json());

public.use("/", router);
public.use("/static", express.static(__dirname + "/client"))
public.use("/secured", secured)

https.createServer(sslOptions, public).listen(443, () => {
  console.log("Running at https://localhost | https://caca.onthewifi.com")
})

let Frames = []

Renderer.on("message", (data) => {
    Frames.push(data)
})

public.get("/settings", (req, res) => {
  Renderer.postMessage({
    type: "retrieve",
  })

})
  
secured.get("/security", (req, res) => {
  res.status(200).json({response: "AUTHORIZED"})
})

secured.post('/settings/update', (req, res) => {

})

public.get("/", (req, res) => {
  res.status(200).sendFile(__dirname + "/client/html/login.html")
})

public.post("/auth/login", (req, res) => {
  const success = CheckAuthentication(req, res)

  if (success) {
    res.status(200).json({response: "LOGGED-IN"})
  }
})

public.post("/auth/logout", (req, res) => {
  res.status(401).json({response: "BAD-REQUEST"})
})

secured.get('/video', (req, res) => {
  var Data = {
    ["stats"]: {
      ["compressed"]: 0,
      ["uncompressed"]: 0,
      ["bitdepth"]: Settings.Compression,
      ["unempty"]: []
    }
  }

  for (var ind = 1; ind < Math.min(Frames.length, Settings.ClientFramesPerRequest + 1); ind++) {
    var frame = Frames.shift()

    Data.stats.compressed += frame.stats.compressed;
    Data.stats.uncompressed += frame.stats.uncompressed;

    if (frame.stats.uncompressed != 0) {
      delete frame.stats

      Data[ind] = frame
      Data.stats.unempty.push(ind)
    }
  } 

  res.status(200).send(JSON.stringify(Data))
})
