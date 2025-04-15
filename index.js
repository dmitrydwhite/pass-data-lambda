const http = require('http');

const passServer = http.createServer((req, res) => {
    const url = new URL(`https://${req.headers.host}${req.url || ''}`);
    const path = url.pathname;

    console.log('path', path);

    res.writeHead(200);
    res.end();
});

passServer.listen(8080);
