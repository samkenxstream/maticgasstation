const { createServer } = require('http')
const { existsSync } = require('fs')
const cors = require('cors')
const { join } = require('path')
const app = require('express')()
const morgan = require('morgan')

const host = process.env.HOST || '127.0.0.1'
const port = process.env.PORT || 7000
const target = join(__dirname, process.env.TARGET_FILE || 'sink.json');

app.use(morgan('tiny'))
app.use(cors())

const runServer = _ => {
    app.get('/', (_, res) => {
        if (existsSync(target)) {
            res.status(200).type('application/json').sendFile(target)
        } else {
            res.status(500).json({ msg: "not available" })
        }
    })

    createServer(app).listen(port, host, _ => {
        console.log(`🔥 Listening at http://${host}:${port}`)
    })
}

module.exports = { runServer }
