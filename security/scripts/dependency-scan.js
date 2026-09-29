#!/usr/bin/env node
// =============================================================================
// Dependency Inventory & Vulnerability Scanner
// =============================================================================
// Reads package.json files and generates a dependency inventory.
// Flags known vulnerable packages based on embedded CVE database.
// =============================================================================

const fs = require('fs');
const path = require('path');

// Known CVE database (from authoritative sources: NVD, GitHub Advisories)
const CVE_DATABASE = {
  'jsonwebtoken': [
    {
      cve: 'CVE-2022-23541',
      affected: '<= 8.5.1',
      fixed: '9.0.0',
      cvss_score: 5.0,
      cvss_version: '3.1',
      cvss_vector: 'CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:L/I:L/A:L',
      severity: 'MEDIUM',
      description: 'Authentication bypass via algorithm confusion when key retrieval function is poorly implemented.',
      source: 'NVD (CNA: GitHub, Inc.)'
    }
  ],
  'express': [
    {
      cve: 'CVE-2024-43796',
      affected: '< 4.20.0',
      fixed: '4.20.0',
      cvss_score: 5.0,
      cvss_version: '3.1',
      cvss_vector: 'CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:L/A:L',
      severity: 'MEDIUM',
      description: 'XSS vulnerability in response.redirect() when processing untrusted user input.',
      source: 'NVD'
    }
  ]
};

function isVersionAffected(installed, affectedRange) {
  // Simple version comparison for our known cases
  const clean = installed.replace(/[\^~>=<\s]/g, '');
  if (affectedRange.startsWith('<= ')) {
    const max = affectedRange.replace('<= ', '');
    return compareVersions(clean, max) <= 0;
  }
  if (affectedRange.startsWith('< ')) {
    const max = affectedRange.replace('< ', '');
    return compareVersions(clean, max) < 0;
  }
  return false;
}

function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
  }
  return 0;
}

function scanPackage(pkgPath, name) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const inventory = [];

  for (const [depName, version] of Object.entries(deps)) {
    const entry = {
      package: depName,
      installed_version: version,
      type: pkg.dependencies?.[depName] ? 'direct' : 'dev',
      component: name,
      vulnerabilities: []
    };

    // Check against CVE database
    if (CVE_DATABASE[depName]) {
      for (const cve of CVE_DATABASE[depName]) {
        if (isVersionAffected(version, cve.affected)) {
          entry.vulnerabilities.push(cve);
        }
      }
    }

    inventory.push(entry);
  }

  return inventory;
}

function main() {
  console.log('='.repeat(70));
  console.log('DEPENDENCY INVENTORY & VULNERABILITY SCAN');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('='.repeat(70));

  const serverPkgPath = path.resolve(__dirname, '../../server/package.json');
  const clientPkgPath = path.resolve(__dirname, '../../client/package.json');

  let inventory = [];

  if (fs.existsSync(serverPkgPath)) {
    inventory = inventory.concat(scanPackage(serverPkgPath, 'server'));
  }
  if (fs.existsSync(clientPkgPath)) {
    inventory = inventory.concat(scanPackage(clientPkgPath, 'client'));
  }

  // Display results
  const vulnerable = inventory.filter(d => d.vulnerabilities.length > 0);

  console.log(`\nTotal dependencies: ${inventory.length}`);
  console.log(`Vulnerable: ${vulnerable.length}`);

  if (vulnerable.length > 0) {
    console.log('\n--- VULNERABLE DEPENDENCIES ---\n');
    for (const dep of vulnerable) {
      for (const vuln of dep.vulnerabilities) {
        console.log(`❌ ${dep.package}@${dep.installed_version} (${dep.component})`);
        console.log(`   CVE: ${vuln.cve}`);
        console.log(`   Severity: ${vuln.severity} (CVSS ${vuln.cvss_score})`);
        console.log(`   Fixed in: ${vuln.fixed}`);
        console.log(`   ${vuln.description}`);
        console.log('');
      }
    }
  } else {
    console.log('\n✅ No known vulnerabilities found in direct dependencies.\n');
  }

  // Save reports
  const reportsDir = path.resolve(__dirname, '../reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  const report = {
    timestamp: new Date().toISOString(),
    total_dependencies: inventory.length,
    vulnerable_count: vulnerable.length,
    inventory,
    cve_database_source: 'NVD, GitHub Security Advisories'
  };

  fs.writeFileSync(
    path.join(reportsDir, 'dependency-inventory.json'),
    JSON.stringify(report, null, 2)
  );

  // Markdown report
  let md = `# Dependency Inventory\n\n`;
  md += `**Scan Date:** ${report.timestamp}\n`;
  md += `**Total Dependencies:** ${report.total_dependencies}\n`;
  md += `**Vulnerable:** ${report.vulnerable_count}\n\n`;
  md += `## All Dependencies\n\n`;
  md += `| Package | Version | Type | Component | Vulnerabilities | Severity | Fixed |\n`;
  md += `|---|---|---|---|---|---|---|\n`;
  for (const dep of inventory) {
    const vulns = dep.vulnerabilities.length > 0
      ? dep.vulnerabilities.map(v => v.cve).join(', ')
      : 'None';
    const severity = dep.vulnerabilities.length > 0
      ? dep.vulnerabilities.map(v => v.severity).join(', ')
      : '-';
    const fixed = dep.vulnerabilities.length > 0
      ? dep.vulnerabilities.map(v => v.fixed).join(', ')
      : '-';
    md += `| ${dep.package} | ${dep.installed_version} | ${dep.type} | ${dep.component} | ${vulns} | ${severity} | ${fixed} |\n`;
  }

  if (vulnerable.length > 0) {
    md += `\n## Vulnerable Dependencies Detail\n\n`;
    for (const dep of vulnerable) {
      for (const vuln of dep.vulnerabilities) {
        md += `### ${dep.package}@${dep.installed_version}\n\n`;
        md += `- **CVE:** ${vuln.cve}\n`;
        md += `- **CVSS Score:** ${vuln.cvss_score} (${vuln.cvss_version})\n`;
        md += `- **CVSS Vector:** ${vuln.cvss_vector}\n`;
        md += `- **Severity:** ${vuln.severity}\n`;
        md += `- **Affected Versions:** ${vuln.affected}\n`;
        md += `- **Fixed Version:** ${vuln.fixed}\n`;
        md += `- **Description:** ${vuln.description}\n`;
        md += `- **Source:** ${vuln.source}\n\n`;
      }
    }
  }

  fs.writeFileSync(path.join(reportsDir, 'dependency-inventory.md'), md);
  console.log('Reports saved to security/reports/');
}

main();
