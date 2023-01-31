require('dotenv').config()

const {Worker} = require("worker_threads") 

const express = require('express');
const router = express.Router();
const secured = express.Router()
const public = express();

const Renderer = new Worker("./worker-school.js")
const Settings = require('./settings');

let Authorized = []

function CheckAuthentication(req, res, next) {
  const ip = req.socket.remoteAddress.toString()
  console.log()
  console.log("Checking authentication for: " + ip)
 //
  console.table(Authorized)

  if (Authorized.includes(ip)) {
    if (next) {next();}

    return true;
  }

  const login = req.body.user
  const password = req.body.pass

  if (login && password && login === process.env.ROOT && password === process.env.ROOTPASSWORD) {
    if (next) {next();}

    console.log("New whitelist pushed: " + ip)
    Authorized.push(ip)

    return true;
  } else {
    console.log("Not authorized")
    console.log()
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

public.listen(1820, () => {
  console.log("Running at http://localhost:1820/")
})

Renderer.on("message", (data) => {
    Frames.push(data)
})

secured.get("/security", (req, res) => {
  res.status(200).json({response: "AUTHORIZED"})
})

secured.post('/settings/update', (req, res) => {

})

public.get("/", (req, res) => {
  res.status(200).sendFile(__dirname + "/client/login.html")
})

public.post("/auth-api/login", (req, res) => {
  console.log("auth-api/login: " + req.socket.remoteAddress.toString())
  const success = CheckAuthentication(req, res)

  if (success) {
    res.status(200).json({response: "LOGGED-IN"})
  }
})

public.post("/auth-api/logout", (req, res) => {
  res.status(401).json({response: "BAD-REQUEST"})

  let x = Authorized.indexOf(req.socket.remoteAddress)
  Authorized.splice(x, 1)
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
