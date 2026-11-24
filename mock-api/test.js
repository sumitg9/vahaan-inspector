const { EventEmitter } = require('events');
const server = require('./server');

function testEndpoint(method, urlPath, headers = {}, body = null) {
  return new Promise((resolve) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = urlPath;
    req.headers = headers;

    const res = new EventEmitter();
    let statusCode = 200;
    let responseHeaders = {};
    let responseBody = '';

    res.writeHead = (status, hdrs) => {
      statusCode = status;
      if (hdrs) responseHeaders = hdrs;
    };
    res.setHeader = (k, v) => {
      responseHeaders[k] = v;
    };
    res.write = (chunk) => {
      responseBody += chunk;
    };
    res.end = (chunk) => {
      if (chunk) responseBody += chunk;
      let parsed = null;
      try {
        parsed = JSON.parse(responseBody);
      } catch (e) {
        parsed = responseBody;
      }
      resolve({ status: statusCode, headers: responseHeaders, body: parsed });
    };

    // Emit req to server request listener
    const listeners = server.listeners('request');
    if (listeners.length > 0) {
      listeners[0](req, res);
    }

    if (body) {
      req.emit('data', JSON.stringify(body));
    }
    req.emit('end');
  });
}

async function runTests() {
  console.log('[Mock API In-Memory Test Suite] Starting test runner...');

  let passed = 0;
  let failed = 0;

  async function assert(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Health Endpoint Test
  await assert('Health endpoint returns 200 OK and service status', async () => {
    const res = await testEndpoint('GET', '/health');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.status !== 'ok') throw new Error('Status not ok');
  });

  // 2. Standard Vehicle RC Lookup Test
  await assert('Standard RC lookup returns 200 with vehicle details', async () => {
    const res = await testEndpoint('POST', '/api/v1/vehicle/rc-v1', { 'content-type': 'application/json' }, { reg_no: 'MH12AB1234' });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.data.rc_number !== 'MH12AB1234') throw new Error('Incorrect RC number');
    if (!res.body.data.chassis_number) throw new Error('Missing chassis number');
  });

  // 3. Partial / Restricted Vehicle RC Lookup Test
  await assert('Restricted RC lookup returns masked owner name', async () => {
    const res = await testEndpoint('POST', '/api/v1/vehicle/rc-v1', { 'content-type': 'application/json' }, { reg_no: 'DL01XY9999' });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.data.owner_name.includes('*')) throw new Error('Owner name not masked');
  });

  // 4. Rate Limit (429) Scenario Test
  await assert('Rate limit header returns 429 Too Many Requests', async () => {
    const res = await testEndpoint('POST', '/api/v1/vehicle/rc-v1', { 'x-mock-scenario': 'RATE_LIMIT' }, { reg_no: 'MH12AB1234' });
    if (res.status !== 429) throw new Error(`Expected 429, got ${res.status}`);
  });

  // 5. Multiple Challans Test
  await assert('Challan endpoint returns list of violations', async () => {
    const res = await testEndpoint('POST', '/api/v1/echallan/rc-challan', { 'content-type': 'application/json' }, { reg_no: 'MH12AB1234' });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.data.total_challans !== 2) throw new Error('Expected 2 challans');
  });

  // 6. Clean / No Challans Test
  await assert('Clean vehicle returns 0 challans', async () => {
    const res = await testEndpoint('POST', '/api/v1/echallan/rc-challan', { 'content-type': 'application/json' }, { reg_no: 'KA01MJ0001' });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.data.total_challans !== 0) throw new Error('Expected 0 challans');
  });

  console.log(`\n[Mock API Test Suite Summary] Passed: ${passed}, Failed: ${failed}`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('All Mock API tests verified successfully.\n');
  }
}

runTests().catch(err => {
  console.error('Test suite crashed:', err);
  process.exit(1);
});
