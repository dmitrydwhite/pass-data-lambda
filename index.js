const http = require('http');
const { getPathSegment } = require('./utilities/utils');
const handleTransitRequests = require('./routes/transits');
const handleObserveRequests = require('./routes/observe');
const handleTleRequests = require('./routes/tle');
const handleTransitDetailsRequests = require('./routes/transit-details');

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
        case 'transit-details':
            handleTransitDetailsRequests(req, res, url);
            break;
        case 'index':
            res.writeHead(200);
            res.write('<p>PASS DATA</p>');
            break;
        default:
            console.error(`No route found for ${path}`);
            res.writeHead(404, 'Not Found');
            res.end();
    }
});

passServer.listen(process.env.PORT  , () => {
    console.log('Pass data is listening on', process.env.PORT);
});
