
const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
});

server.listen(3004, '127.0.0.1', () => {
    console.log('Test server running on port 3004');
});
