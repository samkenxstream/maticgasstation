const { config } = require('dotenv')
const path = require('path')
const { createServer } = require('http')
const cors = require('cors')
const app = require('express')()
const morgan = require('morgan')

config({ path: path.join(__dirname, '.env'), silent: true })

const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT || 7000

app.use(morgan('tiny'))
app.use(cors())

const runServer = (_v1Rec, _v2Rec) => {
  app.get('/', (_, res) => {
    res.status(200).json(_v1Rec.servable()).end()
  })

  app.get('/v1', (_, res) => {
    res.status(200).json(_v1Rec.servable()).end()
  })

  app.get('/v2', (_, res) => {
    res.status(200).json(_v2Rec.servable()).end()
  })

  createServer(app).listen(port, host, (_) => {
    console.log(`🔥 Listening on http://${host}:${port}`)
  })
}

module.exports = { runServer }
