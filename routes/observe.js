const http = require('http');
const https = require('https');
const axios = require('axios');
const jspredict = require('jspredict');
const { getPathSegment, validateQth, validateDuration, normalizeQth } = require('../utilities/utils');
const OutputCache = require('../utilities/Cache');

require('dotenv').config();

const httpsAgent = https.Agent({ rejectUnauthorized: false });

const outputCache = new OutputCache();

/**
 * @param {string} pathname 
 */
function normalizePath(pathname) {
    let [t, noradId, lat, long, elev, start, end] = pathname.split('/');

    return [
        t,
        noradId,
        normalizeQth([lat, long, elev]),
        start === 'now' ? Date.now() : Math.floor(Number(start)).toString(),
        Math.ceil(Number(end)).toString(),
    ].join('/');
}

/**
 * @param {http.IncomingMessage} req 
 * @param {http.ServerResponse<http.IncomingMessage & { req: http.IncomingMessage}} res 
 * @param {URL} url
 */
function handleObserveRequests(req, res, url) {
    console.log('Making an observe request');
    const pathname = url.pathname;
    const cachePath = normalizePath(pathname);
    const noradId = getPathSegment(pathname, 1);
    const [lat, long, elev] = [2, 3, 4].map(i => getPathSegment(pathname, i)).map(r => decodeURIComponent(r)).map(n => Number(n));
    const startTime = getPathSegment(pathname, 5);
    const endTime = getPathSegment(pathname, 6);

    if (!validateQth(lat, long, elev)) {
        console.error(`Bad QTH: ${[lat, long, elev]}`);
        res.writeHead(400, 'Bad Request');
        res.write(JSON.stringify({ error: `The provided QTH Lat ${lat} Long ${long} Elevation ${elev} is not valid`}));
        res.end();
        return;
    }

    if (!validateDuration(startTime, endTime)) {
        console.error(`Bad time params: ${startTime} to ${endTime}`);
        res.writeHead(400, 'Bad Request');
        res.write(JSON.stringify({ error: `End time must be after start time, and duration cannot be more than one hour`}));
        res.end();
        return;
    }

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

            const start = startTime === 'now' ? Date.now() : Math.floor(Number(startTime));
            const end = Math.floor(Number(endTime));

            const pointings = jspredict.observes(tle, [lat, long, elev], start, end);
            const output = JSON.stringify({ count: pointings.length, pointings, qth: [lat, long, elev], noradId });

            outputCache.update(cachePath, output);
            res.writeHead(200);
            res.write(output);
            res.end();
        });
}

module.exports = handleObserveRequests;
