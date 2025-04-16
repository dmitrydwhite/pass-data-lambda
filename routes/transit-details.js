const http = require('http');
const https = require('https');
const axios = require('axios');
const jspredict = require('jspredict');
const { getPathSegment, validateQth, HOURS_72, normalizeQth } = require('../utilities/utils');
const OutputCache = require('../utilities/Cache');

require('dotenv').config();

const httpsAgent = https.Agent({ rejectUnauthorized: false });

const outputCache = new OutputCache();

/**
 * @param {string} pathname 
 */
function normalizePath(pathname) {
    let [t, noradId, lat, long, elev, startTime] = pathname.split('/');

    return [
        t,
        noradId,
        normalizeQth([lat, long, elev]),
        Math.floor(Number(startTime) / 1000).toString(),
    ].join('/');
}

/**
 * @param {http.IncomingMessage} req 
 * @param {http.ServerResponse<http.IncomingMessage & { req: http.IncomingMessage}} res 
 * @param {URL} url
 */
function handleTransitDetailsRequests(req, res, url) {
    console.log('Making a transit details request');
    const pathname = url.pathname;
    const cachedPath = normalizePath(pathname);
    const noradId = getPathSegment(pathname, 1);
    const [lat, long, elev] = [2, 3, 4].map(i => getPathSegment(pathname, i)).map(r => decodeURIComponent(r)).map(n => Number(n));
    const startTime = Math.floor(Number(getPathSegment(pathname, 5)) / 1000);

    if (!validateQth(lat, long, elev)) {
        console.error(`Bad QTH: ${[lat, long, elev]}`);
        res.writeHead(400, 'Bad Request');
        res.write(JSON.stringify({ error: `The provided QTH Lat ${lat} Long ${long} Elevation ${elev} is not valid`}));
        res.end();
        return;
    }

    const cached = outputCache.check(cachedPath);

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

                outputCache.update(cachedPath, output);
                res.writeHead(404, 'Not Found');
                res.write(output);
                res.end();
                return;
            }

            if (tle.split('\n').length < 3) {
                tle = `\n${tle}`;
            }

            const transitDetails = jspredict
                .transits(tle, [lat, long, elev], startTime, startTime + HOURS_72, null, 10)
                .map(t => {
                    const pointings = jspredict.observes(tle, [lat, long, elev], t.start, t.end);

                    return { ...t, pointings };
                });
            
            const output = JSON.stringify({ count: transitDetails.length, transitDetails, qth: [lat, long, elev], noradId });
            
            outputCache.update(cachedPath, output);
            res.writeHead(200);
            res.write(output);
            res.end();
        });
}

module.exports = handleTransitDetailsRequests;
