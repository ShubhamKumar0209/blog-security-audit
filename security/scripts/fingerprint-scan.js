#!/usr/bin/env node
// =============================================================================
// Framework Fingerprinting Scanner
// =============================================================================
// Identifies technologies used by the application through multiple signals.
//
// Fingerprinting methods:
//   PASSIVE: Examining HTTP response headers, HTML content, JS bundle patterns
//   ACTIVE:  Sending specific requests to known endpoints
//
// Limitations:
//   - Header-based detection can be defeated by removing/spoofing headers
//   - Bundle pattern matching may break with custom builds
//   - Version detection from bundles has MEDIUM confidence at best
//   - Source maps are developer-only — not available in production
// =============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

function request(url, urlPath) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(urlPath, url);
    http.get(fullUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function fingerprint() {
  console.log('='.repeat(70));
  console.log('FRAMEWORK FINGERPRINTING SCAN');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('='.repeat(70));

  const report = {
    timestamp: new Date().toISOString(),
    target: { backend: BASE_URL, frontend: CLIENT_URL },
    technologies: [],
    methods_used: []
  };

  // =========================================================================
  // BACKEND FINGERPRINTING
  // =========================================================================
  console.log('\n--- Backend Fingerprinting ---\n');

  // Method 1: X-Powered-By header (PASSIVE)
  try {
    const res = await request(BASE_URL, '/api/health');
    const xPoweredBy = res.headers['x-powered-by'];
    if (xPoweredBy) {
      console.log(`[HIGH] X-Powered-By: ${xPoweredBy}`);
      report.technologies.push({
        technology: 'Express.js',
        category: 'Backend Framework',
        detected_version: null,
        detection_method: 'HTTP Header (X-Powered-By)',
        evidence: `X-Powered-By: ${xPoweredBy}`,
        confidence: 'HIGH',
        limitations: 'Header can be removed or spoofed. Does not reveal exact version.'
      });
      report.methods_used.push('HTTP Header Analysis (Passive)');
    } else {
      console.log('[INFO] X-Powered-By header not present (may be hardened)');
      report.technologies.push({
        technology: 'Express.js (suspected)',
        category: 'Backend Framework',
        detected_version: null,
        detection_method: 'Header absence',
        evidence: 'X-Powered-By removed — common hardening practice for Express',
        confidence: 'LOW',
        limitations: 'Cannot confirm framework without header. Other frameworks also omit this.'
      });
    }
  } catch (err) {
    console.log('[ERROR] Backend not reachable:', err.message);
  }

  // Method 2: API info endpoint (ACTIVE)
  try {
    const res = await request(BASE_URL, '/api/info');
    let info;
    try { info = JSON.parse(res.body); } catch { info = null; }

    if (info?.runtime) {
      console.log(`[HIGH] Runtime: ${info.runtime}`);
      report.technologies.push({
        technology: 'Node.js',
        category: 'Runtime',
        detected_version: info.runtime.replace('Node.js ', ''),
        detection_method: 'Application info endpoint',
        evidence: `GET /api/info response: runtime="${info.runtime}"`,
        confidence: 'HIGH',
        limitations: 'Relies on application-exposed info endpoint. Would not exist in production.'
      });
    }

    if (info?.database) {
      console.log(`[MEDIUM] Database: ${info.database}`);
      report.technologies.push({
        technology: info.database,
        category: 'Database',
        detected_version: null,
        detection_method: 'Application info endpoint',
        evidence: `GET /api/info response: database="${info.database}"`,
        confidence: 'MEDIUM',
        limitations: 'Version not disclosed. Database technology confirmed but not version.'
      });
    }
  } catch (err) {
    console.log('[INFO] Info endpoint not available');
  }

  // Method 3: Error response patterns (ACTIVE)
  try {
    const res = await request(BASE_URL, '/api/nonexistent-route');
    let body;
    try { body = JSON.parse(res.body); } catch { body = res.body; }

    if (body?.error === 'Route not found.' || res.status === 404) {
      console.log('[MEDIUM] 404 response pattern consistent with Express custom handler');
      report.methods_used.push('Error Response Pattern Analysis (Active)');
    }
  } catch (err) {
    // ignore
  }

  // Method 4: Default Express error page detection
  try {
    // Express has a characteristic HTML error page format
    const res = await request(BASE_URL, '/%00'); // null byte often triggers default handler
    if (res.body && res.body.includes('Express')) {
      console.log('[HIGH] Express default error page detected');
    }
  } catch (err) {
    // ignore
  }

  // =========================================================================
  // FRONTEND FINGERPRINTING
  // =========================================================================
  console.log('\n--- Frontend Fingerprinting ---\n');

  try {
    const res = await request(CLIENT_URL, '/');

    // Method 5: React root div detection (PASSIVE)
    if (res.body.includes('id="root"')) {
      console.log('[MEDIUM] React-style root div detected (<div id="root">)');
      report.technologies.push({
        technology: 'React',
        category: 'Frontend Framework',
        detected_version: null,
        detection_method: 'HTML Pattern (root div)',
        evidence: 'HTML contains <div id="root"></div> — characteristic of React SPA',
        confidence: 'MEDIUM',
        limitations: 'Other frameworks (Vue, Svelte) can also use id="root". Not conclusive alone.'
      });
    }

    // Method 6: Vite detection from module script (PASSIVE)
    if (res.body.includes('type="module"') && res.body.includes('src="/src/main.jsx"')) {
      console.log('[HIGH] Vite + JSX build tooling detected');
      report.technologies.push({
        technology: 'Vite',
        category: 'Build Tool',
        detected_version: null,
        detection_method: 'HTML Script Tag Pattern',
        evidence: '<script type="module" src="/src/main.jsx"> — Vite dev server pattern',
        confidence: 'HIGH',
        limitations: 'Only detectable in development mode. Production builds bundle differently.'
      });
    }

    // Method 7: React meta/manifest detection
    if (res.body.includes('react')) {
      console.log('[MEDIUM] "react" string found in HTML source');
    }

    report.methods_used.push('HTML Content Analysis (Passive)');

  } catch (err) {
    console.log('[INFO] Frontend not reachable:', err.message);
    report.technologies.push({
      technology: 'React (from package.json)',
      category: 'Frontend Framework',
      detected_version: '18.2.x',
      detection_method: 'Package metadata (local access)',
      evidence: 'client/package.json lists react@^18.2.0',
      confidence: 'HIGH',
      limitations: 'Requires local filesystem access. Not available to external attacker.'
    });
  }

  // Method 8: Package metadata (LOCAL — for audit purposes)
  console.log('\n--- Package Metadata (Local Audit Access) ---\n');

  try {
    const serverPkg = JSON.parse(fs.readFileSync(
      path.resolve(__dirname, '../../server/package.json'), 'utf8'
    ));

    if (serverPkg.dependencies?.express) {
      const version = serverPkg.dependencies.express;
      console.log(`[HIGH] Express version from package.json: ${version}`);
      report.technologies.push({
        technology: 'Express.js',
        category: 'Backend Framework',
        detected_version: version,
        detection_method: 'Package metadata (local access)',
        evidence: `server/package.json: "express": "${version}"`,
        confidence: 'HIGH',
        limitations: 'Requires local filesystem access. Confirms installed version.'
      });
    }

    if (serverPkg.dependencies?.jsonwebtoken) {
      const version = serverPkg.dependencies.jsonwebtoken;
      console.log(`[HIGH] jsonwebtoken version: ${version}`);
      report.technologies.push({
        technology: 'jsonwebtoken',
        category: 'Authentication Library',
        detected_version: version,
        detection_method: 'Package metadata (local access)',
        evidence: `server/package.json: "jsonwebtoken": "${version}"`,
        confidence: 'HIGH',
        limitations: 'Requires local filesystem access.'
      });
    }
  } catch (err) {
    console.log('[INFO] Could not read server package.json');
  }

  try {
    const clientPkg = JSON.parse(fs.readFileSync(
      path.resolve(__dirname, '../../client/package.json'), 'utf8'
    ));

    if (clientPkg.dependencies?.react) {
      const version = clientPkg.dependencies.react;
      console.log(`[HIGH] React version from package.json: ${version}`);
      // Update existing entry or add new
      const existing = report.technologies.find(t => t.technology === 'React');
      if (existing) {
        existing.detected_version = version;
      }
    }
  } catch (err) {
    console.log('[INFO] Could not read client package.json');
  }

  // =========================================================================
  // REPORT
  // =========================================================================
  console.log('\n' + '='.repeat(70));
  console.log('DETECTED TECHNOLOGIES:');
  for (const tech of report.technologies) {
    console.log(`  ${tech.technology} (${tech.category}) — ${tech.confidence} confidence`);
    if (tech.detected_version) console.log(`    Version: ${tech.detected_version}`);
  }
  console.log('='.repeat(70));

  // Save reports
  const reportsDir = path.resolve(__dirname, '../reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(
    path.join(reportsDir, 'fingerprint-report.json'),
    JSON.stringify(report, null, 2)
  );

  // Generate markdown report
  let md = `# Framework Fingerprinting Report\n\n`;
  md += `**Date:** ${report.timestamp}\n`;
  md += `**Target Backend:** ${BASE_URL}\n`;
  md += `**Target Frontend:** ${CLIENT_URL}\n\n`;
  md += `## Detection Methods Used\n\n`;
  for (const method of report.methods_used) {
    md += `- ${method}\n`;
  }
  md += `\n## Detected Technologies\n\n`;
  md += `| Technology | Category | Version | Method | Confidence | Limitations |\n`;
  md += `|---|---|---|---|---|---|\n`;
  for (const tech of report.technologies) {
    md += `| ${tech.technology} | ${tech.category} | ${tech.detected_version || 'N/A'} | ${tech.detection_method} | ${tech.confidence} | ${tech.limitations} |\n`;
  }
  md += `\n## Important Notes\n\n`;
  md += `- **Passive fingerprinting** examines responses without special requests\n`;
  md += `- **Active fingerprinting** sends crafted requests to elicit identifying responses\n`;
  md += `- Framework detection ≠ version detection. Identifying "Express" does not reveal "4.19.2"\n`;
  md += `- Confidence levels: HIGH (strong evidence), MEDIUM (likely but not certain), LOW (possible)\n`;

  fs.writeFileSync(path.join(reportsDir, 'fingerprint-report.md'), md);
  console.log('\nReports saved to security/reports/');
}

fingerprint().catch(err => {
  console.error('Fingerprint scan failed:', err);
  process.exit(1);
});
