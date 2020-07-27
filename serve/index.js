'use strict';

const createServer = require('http').createServer;
const exists = require('fs').exists;
const cors = require('cors');
const dotnet = require('dotenv');
const path = require('path');

const app = require('express')();

// reading from .env config file, present in this directory
dotnet.config({ path: path.join(__dirname, 'config.env'), silent: true })

const host = process.env.HOST || '127.0.0.1';
const port = process.env.PORT || 8000;
const targetFile = path.join(__dirname, process.env.TARGET_FILE || 'output.json');

/**
 * Simple traffic logger, may be useful in future, can be retrieved using
 * journalctl, if deployed using systemd
 */
app.use((req, res, next) => {
    console.log(`${req.method} | ${req.url} | ${req.ip} | ${Date().toString()}`);
    next();
});

// enabling cors, all domains can query us
app.use(cors());

/**
 * Our simple server is going to serve on this path, attempting to access
 * any other, simply returns 404
 * 
 * Response will be of JSON type.
 * 
 * Note: targetFile is absolute path to gas price data, to be served.
 */
app.get('/', (req, res) => {

    exists(targetFile, (v) => {

        if (v) {

            res.status(200).type('application/json').sendFile(targetFile, (err) => {
                if (err)
                    res.status(404).end();
            });

        } else {

            res.status(404).json({ msg: "not available" });

        }

    });

});

/**
 * For any other path, returns 404
 */
app.get('*', (req, res) => {

    res.status(404).json({ msg: 'bad path' });

});

createServer(app).listen(port, host, () => {
    console.log(`[+]HTTP Server running on http://${host}:${port}`);
});
