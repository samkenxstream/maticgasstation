'use strict';

const createServer = require('http').createServer;
const exists = require('fs').exists;
const cors = require('cors');

// put absolute path to target file
const TARGETFILE = '';
const PORT = 8000;
const HOST = '0.0.0.0';

const app = require('express')();

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
 */
app.get('/', (req, res) => {

    exists(TARGETFILE, (v) => {

        if (v) {

            res.status(200).type('application/json').sendFile(TARGETFILE, (err) => {
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

createServer(app).listen(PORT, HOST, () => {
    console.log(`[+]HTTP Server running on http://${HOST}:${PORT}`);
});
