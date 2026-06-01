import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../quiz');
const PORT = 8765;

const MIME = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  try {
    let filePath = path.join(root, req.url.split('?')[0]);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(root, 'index.html');
    }
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'text/plain',
    });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.keepAliveTimeout = 1;
server.headersTimeout = 2000;

server.on('error', (err) => { if (err.code !== 'EADDRINUSE') console.error('Server error:', err); });
server.listen(PORT, '127.0.0.1', () => console.log(`Server on ${PORT}`));
