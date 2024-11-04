const http = require('http');
const crypto = require('crypto');

const secret = 'secure-secret';

function createJWT(payload) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto.createHmac('sha256', secret)
        .update(signatureInput)
        .digest('base64url');

    return `${signatureInput}.${signature}`;
}

function verifyJWT(token) {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) return false;

    const signatureInput = `${header}.${payload}`;
    const expectedSignature = crypto.createHmac('sha256', secret)
        .update(signatureInput)
        .digest('base64url');

    return signature === expectedSignature;
}

http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/generate') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const { username } = JSON.parse(body);
            const token = createJWT({ username, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + (60 * 60) }); // 1-hour expiration
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ token }));
        });
    } else if (req.method === 'POST' && req.url === '/validate') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const { token } = JSON.parse(body);
            const isValid = verifyJWT(token);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: isValid ? 'Token is valid' : 'Token is invalid' }));
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
}).listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
