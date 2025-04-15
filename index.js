const http = require('http');
const { getPathSegment } = require('./utilities/utils');
const handleTransitRequests = require('./routes/transits');
const handleObserveRequests = require('./routes/observe');

require('dotenv').config();

const passServer = http.createServer((req, res) => {
    const url = new URL(`https://${req.headers.host}${req.url || ''}`);
    const path = url.pathname;
    const primary = getPathSegment(path, 0);

    switch (primary) {
        case 'transits':
            handleTransitRequests(req, res, url);
            break;
        case 'observe':
            handleObserveRequests(req, res, url);
            break;
        case 'tle':
            handleTleRequests(req, res, url);
            break;
        default:
            console.error(`No route found for ${path}`);
            res.writeHead(404, 'Not Found');
            res.end();
    }
});

passServer.listen(process.env.PORT  , () => {
    console.log('Pass Data is Listening');
});
