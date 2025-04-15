const http = require('http');
const https = require('https');
const axios = require('axios');
const { getPathSegment } = require('../utilities/utils');
const OutputCache = require('../utilities/Cache');

require('dotenv').config();

const httpsAgent = https.Agent({ rejectUnauthorized: false });

const outputCache = new OutputCache();

/**
 * @param {string} pathname 
 */
function normalizePath(pathname) {
    let [t, noradId] = pathname.split('/');

    return [
        t,
        noradId,
    ].join('/');
}

/**
 * @param {http.IncomingMessage} req 
 * @param {http.ServerResponse<http.IncomingMessage & { req: http.IncomingMessage}} res 
 * @param {URL} url
 */
function handleTleRequests(req, res, url) {
    console.log('Making a tle request');
    const pathname = url.pathname;
    const cachePath = normalizePath(pathname);
    const noradId = getPathSegment(pathname, 1);

    const cached = outputCache.check(cachePath);

    if (cached) {
        res.writeHead(200, 'OK');
        res.write(cached);
        res.end();

        return;
    }

    axios.get(`https://api.n2yo.com/rest/v1/satellite/tle/${noradId}&apiKey=${process.env.N2YO_KEY}`, { httpsAgent })
        .then(({ data }) => {
            let { tle } = data;

            if (!tle) {
                const output = JSON.stringify({ error: `NORAD ID ${noradId} not recognized`})

                console.error(`No TLE for ${noradId} found on N2YO`);

                outputCache.update(cachePath, output);
                res.writeHead(404, 'Not Found');
                res.write(output);
                res.end();
                return;
            }

            if (tle.split('\n').length < 3) {
                tle = `\n${tle}`;
            }

            const output = JSON.stringify({ tle, noradId });

            outputCache.update(cachePath, output);
            res.writeHead(200);
            res.write(output);
            res.end();
        });
}

module.exports = handleTleRequests;
