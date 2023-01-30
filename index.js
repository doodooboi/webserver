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
const Settings = require('./settings')

function auth(req, res, next) {
  const b64auth = (req.headers.authorization || '').split(' ')[1] || ''

  if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
    return res.status(401).json({ response: 'Missing Authorization Header' });
  }

  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')

  if (login && password && login === process.env.ROOT && password === process.env.ROOTPASSWORD) {
    return next()
  }

  res.set('WWW-Authenticate', 'Basic realm="401"')
  res.status(401).send('Authentication required to access resource.')
}

secured.use(auth)
secured.use(express.urlencoded({ extended: true }));
secured.use(express.json());

public.use(express.urlencoded({ extended: true }));
public.use(express.json());

public.use("/", router);
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
  
secured.post('/settings/update', (req, res) => {

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
