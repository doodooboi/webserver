require('dotenv').config()

const {Worker} = require("worker_threads") 

const express = require('express');
const router = express.Router();
const secured = express.Router()
const public = express();

const Renderer = new Worker("./worker-school.js")
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

public.listen(1820, () => {
  console.log("Running at http://localhost:1820")
})

Renderer.on("message", (data) => {
    Frames.push(data)
})

public.get("/settings", (req, res) => {
  Renderer.postMessage({
    type: "retrieve",
  })

  res.status(200).json({response: "OK"})
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

  for (var ind = 1; ind <  Settings.ClientFramesPerRequest + 1; ind++) {
      Data[ind] = "undata"
      Data.stats.unempty.push(ind)
    } 

  res.status(200).send(JSON.stringify(Data))
})
