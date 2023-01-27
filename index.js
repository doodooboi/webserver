const {Worker} = require("worker_threads") 

const express = require('express');
const router = express.Router();
const app = express();

const Renderer = new Worker("./capture.js")

let Frames = []

function AuthenticateUser(req, res, next) {
  const b64auth = (req.headers.authorization || '').split(' ')[1] || ''

  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')

  if (login && password && login === process.env.USER && password === process.env.PASSWORD) {
    return next()
  }

  res.set('WWW-Authenticate', 'Basic realm="401"')
  res.status(401).send('Authentication required to access resource.')
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/", router);

Renderer.on("message", (data) => {
    Frames.push(data)
})

app.get("/settings", (req, res) => {

})
  
app.get('/dfbgiebh2', (req, res) => {
  var Data = {
    ["stats"]: {
      ["compressed"]: 0,
      ["uncompressed"]: 0,
      ["skipped"]: 0,
      ["mode"]: 9,
      ["unempty"]: []
    }
  }

  for (var ind = 1; ind < Math.min(Frames.length, Repeats + 1); ind++) {
    var frame = Frames.shift()

    Data.stats.compressed += frame.stats.compressed;
    Data.stats.uncompressed += frame.stats.uncompressed;
    Data.stats.skipped += frame.stats.skipped;

    if (frame.stats.uncompressed != 0) {
      delete frame.stats

      Data[ind] = frame
      Data.stats.unempty.push(ind)
    }
  } 

  //console.log(Data.stats.compressed, Data.stats.skipped)

//  if (Data.stats.uncompressed === 0) {
 //   res.status(500).send("-1")
 // } else {
    res.status(200).send(JSON.stringify(Data))
 // }

})

app.listen(1820, () => {
  console.log("Listening on 1820")
})

