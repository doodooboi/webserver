require('dotenv').config()

const {Worker} = require("worker_threads") 

const express = require('express');
const router = express.Router();
const secured = express.Router()
const public = express();

const Renderer = new Worker("./worker-school.js")
const Settings = require('./settings');

let authorized = []

function auth(req, res, next) {
  console.log(req.body)

  if (authorized.includes(req.socket.remoteAddress)) {
    console.log("auth-bypass")
    res.json({response: "ALREADY LOGGED IN"})
    if (next) {
      return next()
    }

    return true;
  } 

  //const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
//
  //if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
  //  return res.status(401).json({ response: 'Missing Authorization Header' });
  //}
//
  //const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')
  const login = req.body.user
  const password = req.body.pass

  if (login && password && login === process.env.ROOT && password === process.env.ROOTPASSWORD) {
    authorized.push(req.socket.remoteAddress)
    res.json({response:"LOGGED IN AS ROOT"})
    if (next) {
     return next()
    }

    return true;
  } else {
    res.status(401).json({response: "INCORRECT USER/PASS"})
  }

  //res.set('WWW-Authenticate', 'Basic realm="401"')
}

secured.use(auth)
secured.use(express.urlencoded({ extended: true }));
secured.use(express.json());

public.use(express.urlencoded({ extended: true }));
public.use(express.json());

public.use("/", router);
public.use("/static", express.static(__dirname + "/client"))
public.use("/secured", secured)

public.listen(1820, () => {
  console.log("Running at http://localhost:1820/web")
})

Renderer.on("message", (data) => {
    Frames.push(data)
})

public.post("/authorize", (req, res) => {
  auth(req, res)
})

public.get("/deauth", (req, res) => {

})

public.get("/web", (req, res) => {
  res.sendFile(__dirname + "/./client/test.html")
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
