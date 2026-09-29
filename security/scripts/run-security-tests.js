#!/usr/bin/env node
// =============================================================================
// Security Test Suite
// =============================================================================
// Automated security tests for the blogging platform.
// Tests both baseline (vulnerable) and hardened configurations.
//
// Usage:
//   node security/scripts/run-security-tests.js [--mode baseline|hardened]
// =============================================================================

const http = require('http');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const mode = process.argv.includes('--mode')
  ? process.argv[process.argv.indexOf('--mode') + 1]
  : 'baseline';

let passed = 0;
let failed = 0;
let token = '';
let userId = '';
const results = [];

function log(type, test, detail = '') {
  const icon = type === 'PASS' ? '✅' : type === 'FAIL' ? '❌' : 'ℹ️';
  const msg = `${icon} [${type}] ${test}${detail ? ' — ' + detail : ''}`;
  console.log(msg);
  results.push({ type, test, detail, timestamp: new Date().toISOString() });
  if (type === 'PASS') passed++;
  if (type === 'FAIL') failed++;
}

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('='.repeat(70));
  console.log(`SECURITY TEST SUITE — Mode: ${mode.toUpperCase()}`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('='.repeat(70));

  // =====================================================================
  // 1. AUTHENTICATION TESTS
  // =====================================================================
  console.log('\n--- Authentication Tests ---');

  // Test: Invalid login
  {
    const res = await request('POST', '/api/auth/login', {
      email: 'nonexistent@test.com',
      password: 'wrong'
    });
    if (res.status === 401) {
      log('PASS', 'Invalid login returns 401');
    } else {
      log('FAIL', 'Invalid login returns 401', `Got ${res.status}`);
    }
  }

  // Test: Missing token
  {
    const res = await request('GET', '/api/auth/profile');
    if (res.status === 401) {
      log('PASS', 'Missing token returns 401');
    } else {
      log('FAIL', 'Missing token returns 401', `Got ${res.status}`);
    }
  }

  // Test: Invalid token
  {
    const res = await request('GET', '/api/auth/profile', null, {
      'Authorization': 'Bearer invalidtoken123'
    });
    if (res.status === 401) {
      log('PASS', 'Invalid token returns 401');
    } else {
      log('FAIL', 'Invalid token returns 401', `Got ${res.status}`);
    }
  }

  // Test: Registration (for subsequent tests)
  {
    const testEmail = `test_${Date.now()}@test.com`;
    const res = await request('POST', '/api/auth/register', {
      name: 'Security Tester',
      email: testEmail,
      password: 'Test@1234'
    });
    if (res.status === 201 && res.body.token) {
      token = res.body.token;
      userId = res.body.user._id;
      log('PASS', 'Registration succeeds');
    } else {
      log('FAIL', 'Registration succeeds', `Got ${res.status}: ${JSON.stringify(res.body)}`);
    }
  }

  // =====================================================================
  // 2. AUTHORIZATION TESTS
  // =====================================================================
  console.log('\n--- Authorization Tests ---');

  // Test: User cannot access admin routes
  {
    const res = await request('GET', '/api/admin/users', null, {
      'Authorization': `Bearer ${token}`
    });
    if (res.status === 403) {
      log('PASS', 'Non-admin cannot access admin routes');
    } else {
      log('FAIL', 'Non-admin cannot access admin routes', `Got ${res.status}`);
    }
  }

  // Test: Create a post then try to update as different user
  let testPostId = '';
  {
    const createRes = await request('POST', '/api/posts', {
      title: 'Auth Test Post',
      content: 'Testing authorization controls.'
    }, { 'Authorization': `Bearer ${token}` });

    if (createRes.status === 201) {
      testPostId = createRes.body.post._id;
      log('PASS', 'User can create a post');
    } else {
      log('FAIL', 'User can create a post', `Got ${createRes.status}`);
    }
  }

  // =====================================================================
  // 3. INPUT VALIDATION TESTS
  // =====================================================================
  console.log('\n--- Input Validation Tests ---');

  // Test: Missing required fields
  {
    const res = await request('POST', '/api/posts', {}, {
      'Authorization': `Bearer ${token}`
    });
    if (res.status === 400) {
      log('PASS', 'Missing required fields returns 400');
    } else {
      log('FAIL', 'Missing required fields returns 400', `Got ${res.status}`);
    }
  }

  // Test: Oversized input
  {
    const longContent = 'A'.repeat(100000);
    const res = await request('POST', '/api/posts', {
      title: 'T'.repeat(300),
      content: longContent
    }, { 'Authorization': `Bearer ${token}` });

    if (mode === 'hardened') {
      if (res.status === 400) {
        log('PASS', 'Oversized input rejected (hardened)');
      } else {
        log('FAIL', 'Oversized input rejected (hardened)', `Got ${res.status}`);
      }
    } else {
      log('INFO', 'Oversized input accepted (baseline)', `Status ${res.status}`);
    }
  }

  // =====================================================================
  // 4. XSS TESTS
  // =====================================================================
  console.log('\n--- XSS Tests ---');

  // Test: XSS payload in comment
  {
    if (testPostId) {
      const xssPayload = '<script>alert("XSS Demo")</script>';
      const res = await request('POST', `/api/comments/${testPostId}`, {
        content: xssPayload
      }, { 'Authorization': `Bearer ${token}` });

      if (res.status === 201) {
        const stored = res.body.comment.content;
        if (stored.includes('<script>')) {
          if (mode === 'baseline') {
            log('PASS', 'XSS payload stored as-is (baseline — expected vulnerability)');
          } else {
            log('FAIL', 'XSS payload stored as-is (hardened — should be sanitized)');
          }
        } else {
          if (mode === 'hardened') {
            log('PASS', 'XSS payload sanitized (hardened)');
          } else {
            log('INFO', 'XSS payload was modified', `Stored: ${stored.substring(0, 50)}`);
          }
        }
      } else {
        log('INFO', 'XSS comment submission', `Status: ${res.status}`);
      }
    }
  }

  // =====================================================================
  // 5. RATE LIMITING TESTS
  // =====================================================================
  console.log('\n--- Rate Limiting Tests ---');

  {
    let rateLimited = false;
    const testEmail = `ratelimit_${Date.now()}@test.com`;
    for (let i = 0; i < 10; i++) {
      const res = await request('POST', '/api/auth/login', {
        email: testEmail,
        password: 'wrong'
      });
      if (res.status === 429) {
        rateLimited = true;
        break;
      }
    }

    if (mode === 'hardened') {
      if (rateLimited) {
        log('PASS', 'Rate limiting triggers on repeated auth attempts (hardened)');
      } else {
        log('FAIL', 'Rate limiting should trigger (hardened)');
      }
    } else {
      if (!rateLimited) {
        log('PASS', 'No rate limiting in baseline mode (expected vulnerability)');
      } else {
        log('INFO', 'Rate limiting unexpectedly triggered in baseline');
      }
    }
  }

  // =====================================================================
  // 6. SECURITY HEADERS TESTS
  // =====================================================================
  console.log('\n--- Security Headers Tests ---');

  {
    const res = await request('GET', '/api/health');
    const headers = res.headers;

    const requiredHeaders = [
      'content-security-policy',
      'x-content-type-options',
      'referrer-policy',
      'permissions-policy',
      'x-frame-options'
    ];

    for (const header of requiredHeaders) {
      if (mode === 'hardened') {
        if (headers[header]) {
          log('PASS', `Header present: ${header}`, headers[header].substring(0, 60));
        } else {
          log('FAIL', `Header missing: ${header}`);
        }
      } else {
        if (!headers[header]) {
          log('PASS', `Header absent in baseline: ${header} (expected vulnerability)`);
        } else {
          log('INFO', `Header unexpectedly present in baseline: ${header}`);
        }
      }
    }

    // X-Powered-By check
    if (mode === 'hardened') {
      if (!headers['x-powered-by']) {
        log('PASS', 'X-Powered-By removed (hardened)');
      } else {
        log('FAIL', 'X-Powered-By still present (hardened)');
      }
    } else {
      if (headers['x-powered-by']) {
        log('PASS', 'X-Powered-By exposed in baseline (expected)', headers['x-powered-by']);
      }
    }
  }

  // =====================================================================
  // 7. ERROR HANDLING TESTS
  // =====================================================================
  console.log('\n--- Error Handling Tests ---');

  // Test: Invalid route param to trigger error
  {
    const res = await request('GET', '/api/posts/invalid-id-format');
    if (mode === 'hardened') {
      if (!res.body.stack && !res.body.database_error) {
        log('PASS', 'Error response does not contain stack trace (hardened)');
      } else {
        log('FAIL', 'Error response contains stack trace (hardened)');
      }
    } else {
      if (res.body.stack || res.body.details) {
        log('PASS', 'Error response contains details (baseline — expected)');
      } else {
        log('INFO', 'Error response in baseline', JSON.stringify(res.body).substring(0, 80));
      }
    }
  }

  // =====================================================================
  // CLEANUP
  // =====================================================================
  if (testPostId) {
    await request('DELETE', `/api/posts/${testPostId}`, null, {
      'Authorization': `Bearer ${token}`
    });
  }

  // =====================================================================
  // SUMMARY
  // =====================================================================
  console.log('\n' + '='.repeat(70));
  console.log(`RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('='.repeat(70));

  // Output JSON results
  const reportPath = mode === 'baseline'
    ? 'security/scans/before/security-tests.json'
    : 'security/scans/after/security-tests.json';

  const report = {
    mode,
    timestamp: new Date().toISOString(),
    target: BASE_URL,
    summary: { passed, failed, total: passed + failed },
    results
  };

  const fs = require('fs');
  const path = require('path');
  const dir = path.dirname(path.resolve(reportPath));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.resolve(reportPath), JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
