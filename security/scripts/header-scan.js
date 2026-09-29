#!/usr/bin/env node
// =============================================================================
// HTTP Header Security Scanner
// =============================================================================
// Checks for presence/absence of important security headers.
// =============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

const SECURITY_HEADERS = [
  {
    name: 'Content-Security-Policy',
    description: 'Restricts which resources the browser can load. Primary defense against XSS.',
    attack_class: 'Cross-Site Scripting (XSS), Code Injection',
    appropriate: true,
    why: 'A blog allows user-generated content. CSP prevents injected scripts from executing.'
  },
  {
    name: 'X-Content-Type-Options',
    description: 'Prevents MIME-sniffing. Browser must respect declared content type.',
    attack_class: 'MIME Confusion Attacks',
    appropriate: true,
    why: 'Prevents browsers from interpreting non-script files as JavaScript.'
  },
  {
    name: 'Referrer-Policy',
    description: 'Controls how much referrer information is shared in outgoing requests.',
    attack_class: 'Information Leakage',
    appropriate: true,
    why: 'Prevents leaking internal URL paths to third-party resources.'
  },
  {
    name: 'Permissions-Policy',
    description: 'Controls which browser features (camera, mic, location) are allowed.',
    attack_class: 'Feature Abuse, Privacy Violation',
    appropriate: true,
    why: 'Blog has no need for camera/mic/geolocation. Disabling reduces attack surface.'
  },
  {
    name: 'Strict-Transport-Security',
    description: 'Forces HTTPS connections. Prevents protocol downgrade attacks.',
    attack_class: 'Man-in-the-Middle (MITM)',
    appropriate: false,
    why: 'NOT appropriate for HTTP-only development. Only enable when HTTPS is configured.'
  },
  {
    name: 'X-Frame-Options',
    description: 'Prevents page from being embedded in iframes.',
    attack_class: 'Clickjacking',
    appropriate: true,
    why: 'Blog should not be framed by other sites.'
  },
  {
    name: 'X-XSS-Protection',
    description: 'Legacy browser XSS filter. Modern browsers use CSP instead.',
    attack_class: 'XSS (legacy browsers only)',
    appropriate: true,
    why: 'Defense-in-depth for older browsers that do not support CSP.'
  }
];

function request(urlPath) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers }));
    }).on('error', reject);
  });
}

async function scan() {
  console.log('='.repeat(70));
  console.log('HTTP SECURITY HEADER SCAN');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('='.repeat(70));

  const res = await request('/api/health');
  const results = [];

  for (const header of SECURITY_HEADERS) {
    const value = res.headers[header.name.toLowerCase()];
    const present = !!value;

    const result = {
      header: header.name,
      present,
      value: value || null,
      description: header.description,
      attack_class: header.attack_class,
      appropriate: header.appropriate,
      status: present ? 'PRESENT' : 'MISSING'
    };

    const icon = present ? '✅' : (header.appropriate ? '❌' : '⚪');
    console.log(`\n${icon} ${header.name}: ${present ? value : 'NOT SET'}`);
    console.log(`   Purpose: ${header.description}`);
    console.log(`   Mitigates: ${header.attack_class}`);
    if (!present && header.appropriate) {
      console.log(`   ⚠️  RECOMMENDATION: Enable this header.`);
    }
    if (!header.appropriate) {
      console.log(`   ℹ️  Not appropriate for this environment (HTTP-only dev).`);
    }

    results.push(result);
  }

  // X-Powered-By check
  const xpb = res.headers['x-powered-by'];
  console.log(`\n${xpb ? '❌' : '✅'} X-Powered-By: ${xpb || 'NOT SET (good)'}`);
  results.push({
    header: 'X-Powered-By',
    present: !!xpb,
    value: xpb || null,
    description: 'Reveals backend framework. Should be removed.',
    attack_class: 'Technology Fingerprinting',
    appropriate: false,
    status: xpb ? 'EXPOSED' : 'REMOVED'
  });

  // Save results
  const reportsDir = path.resolve(__dirname, '../reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  const report = {
    timestamp: new Date().toISOString(),
    target: BASE_URL,
    results,
    summary: {
      total: results.length,
      present: results.filter(r => r.present && r.appropriate !== false).length,
      missing: results.filter(r => !r.present && r.appropriate).length
    }
  };

  fs.writeFileSync(path.join(reportsDir, 'header-scan.json'), JSON.stringify(report, null, 2));
  console.log('\n\nReport saved to security/reports/header-scan.json');
}

scan().catch(err => {
  console.error('Header scan failed:', err);
  process.exit(1);
});
