const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 4000;

function loadFixture(filename) {
  const filePath = path.join(__dirname, 'fixtures', filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({ raw: body });
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Mock-Scenario');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health endpoint
  if (pathname === '/health' || pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'vahancheck-mock-api',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }));
    return;
  }

  const body = (method === 'POST') ? await parseBody(req) : {};
  const query = parsedUrl.query;
  const regNo = (body.reg_no || query.reg_no || '').toUpperCase().replace(/\s+/g, '');
  const scenario = req.headers['x-mock-scenario'] || query.scenario || '';

  // Vehicle RC Endpoint: /api/v1/vehicle/rc-v1
  if (pathname === '/api/v1/vehicle/rc-v1') {
    if (scenario === 'TIMEOUT' || regNo.includes('TIMEOUT')) {
      setTimeout(() => {
        res.writeHead(504, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status_code: 504, message: 'Gateway Timeout' }));
      }, 9000);
      return;
    }

    if (scenario === 'RATE_LIMIT' || regNo.includes('429')) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(loadFixture('rate_limit_429.json')));
      return;
    }

    if (scenario === 'INSUFFICIENT_BALANCE' || regNo.includes('402')) {
      res.writeHead(402, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(loadFixture('insufficient_balance.json')));
      return;
    }

    if (scenario === 'SERVER_ERROR' || regNo.includes('500')) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(loadFixture('server_error_500.json')));
      return;
    }

    if (scenario === 'UNEXPECTED_SCHEMA' || regNo.includes('BAD')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(loadFixture('unexpected_schema.json')));
      return;
    }

    if (scenario === 'PARTIAL' || regNo.includes('DL01XY9999')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(loadFixture('partial_restricted.json')));
      return;
    }

    // Default: Success standard
    const fixture = loadFixture('success_standard.json');
    if (regNo) {
      fixture.data.rc_number = regNo;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(fixture));
    return;
  }

  // Challan Endpoint: /api/v1/echallan/rc-challan
  if (pathname === '/api/v1/echallan/rc-challan') {
    if (scenario === 'NO_CHALLANS' || regNo.includes('KA01MJ0001') || regNo.includes('CLEAN')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(loadFixture('no_challans.json')));
      return;
    }

    if (scenario === 'DISPOSED' || regNo.includes('MH04CD5678')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(loadFixture('disposed_history.json')));
      return;
    }

    const fixture = loadFixture('multiple_challans.json');
    if (regNo) {
      fixture.data.reg_no = regNo;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(fixture));
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found', path: pathname }));
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[VahanCheck Mock API Server] Listening on http://localhost:${PORT}`);
  });
}

module.exports = server;
