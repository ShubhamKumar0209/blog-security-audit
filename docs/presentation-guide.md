# Presentation Guide

## Live Demonstration Flow

Follow this sequence for the live demonstration and viva.

---

### Step 1 — Introduction (2 min)

> "This is our security baseline. The vulnerabilities are intentionally introduced in a controlled local environment so that we can demonstrate the complete vulnerability lifecycle."

Show the running application. Point out the **BASELINE** badge in the navbar.

Explain the goal:
**Build → Fingerprint → Identify Versions → Map CVEs → Assess Risk → Demonstrate Vulnerability → Remediate → Harden → Re-test → Compare Before vs After**

---

### Step 2 — Application Architecture (2 min)

Open `docs/architecture.md`. Show the BEFORE diagram.

Key points:
- React SPA frontend
- Express.js REST API backend
- MongoDB database
- JWT authentication
- No security middleware in baseline

---

### Step 3 — Framework Fingerprinting (3 min)

Run the fingerprint scanner:
```bash
node security/scripts/fingerprint-scan.js
```

Show evidence:
- **X-Powered-By: Express** header → HIGH confidence
- **HTML id="root"** → React detected (MEDIUM confidence)
- **Package metadata** → Exact versions (HIGH confidence, requires local access)

Explain:
- Passive vs Active fingerprinting
- Framework detection ≠ version detection
- Why this matters (attackers use versions to find CVEs)

---

### Step 4 — Dependency Inventory (2 min)

Run:
```bash
node security/scripts/dependency-scan.js
```

Show the dependency inventory with package names, versions, and vulnerability flags.

---

### Step 5 — Vulnerable Dependency Identification (2 min)

Point out:
- `jsonwebtoken@8.5.1` → **CVE-2022-23541**
- `express@4.19.2` → **CVE-2024-43796**

Open `security/cve-mapping/CVE-2022-23541.md` for details.

---

### Step 6 — NVD/CVE Details (3 min)

Open the NVD entry: https://nvd.nist.gov/vuln/detail/CVE-2022-23541

Show:
- CVSS score breakdown
- Attack vector, complexity, privileges, impact
- Affected versions and fix version

---

### Step 7 — Risk Assessment (2 min)

Explain using the CVE mapping document:
- **What is the CVE?** Algorithm confusion in jwt.verify()
- **Why does it matter?** Could allow forged tokens
- **How exploitable?** Requires specific misconfiguration (AC: High)
- **What is the impact?** Authentication bypass

Emphasize: **CVSS ≠ Application Risk**

---

### Step 8 — Demonstrate Vulnerabilities (5 min)

#### V-04: XSS
1. Login as alice@blog.local
2. Create a comment with: `<script>alert("XSS Demo")</script>`
3. Show the script tag executing in baseline mode

#### V-02: Missing Headers
```bash
node security/scripts/header-scan.js
```
Show all headers missing.

#### V-03: Weak Validation
Show that a single character password is accepted in baseline.

#### V-07: Authorization Bypass
1. Login as alice@blog.local
2. Use the API to update/delete a post owned by bob@blog.local
3. Show it succeeds (no ownership check)

#### V-05: No Rate Limiting
Show 10+ rapid login attempts all succeed without throttling.

#### V-06: Verbose Errors
Show error response with stack trace, file paths.

---

### Step 9 — Remediation (3 min)

Walk through the security decision log (`security/security-decision-log.md`).

For each vulnerability, explain:
- What was the problem?
- How was it fixed?
- Why was this approach chosen?

---

### Step 10 — Dependency Upgrade (2 min)

Show the version changes:
```
jsonwebtoken: 8.5.1 → 9.0.2
express: 4.19.2 → 4.21.1
```

Run `npm audit` to confirm clean results.

---

### Step 11 — Re-test (3 min)

Switch to hardened mode:
```bash
SECURITY_MODE=hardened node server/src/app.js
```

Run security tests:
```bash
node security/scripts/run-security-tests.js --mode hardened
```

Show all tests passing.

---

### Step 12 — Before vs After (3 min)

Open `docs/before-after.md` and walk through each category.

Show the security scorecard (`security/reports/security-scorecard.md`).

---

### Step 13 — Security Logs (2 min)

Show security log output:
- LOGIN_SUCCESS, LOGIN_FAILURE events
- RATE_LIMIT_TRIGGERED
- AUTHORIZATION_FAILURE

Point out what is logged (event, requestId, userId, route) and what is NOT logged (passwords, tokens).

---

### Step 14 — Hardened Architecture (2 min)

Show the AFTER architecture diagram from `docs/architecture.md`.

Walk through the middleware pipeline ordering and why it matters.

---

### Step 15 — Limitations (2 min)

Be honest about what this project does NOT cover:
- No HTTPS/TLS (development environment)
- No CSRF protection (SPA uses Authorization header, not cookies)
- No rate limiting persistence (in-memory, resets on restart)
- No token revocation mechanism
- No automated CI/CD security scanning
- Fingerprinting countermeasures are limited — determined attackers will still identify technologies

---

## Talking Points for Each Security Control

For every control, be prepared to answer:

| Question | How to Answer |
|---|---|
| What was the problem? | Describe the specific vulnerability |
| How did you detect it? | Fingerprinting, dependency scan, manual testing |
| Why is it a security risk? | Explain the attack scenario |
| What could an attacker do? | Describe realistic impact (don't exaggerate) |
| How did you fix it? | Describe the specific remediation |
| Why this fix? | Explain alternatives and trade-offs |
| How did you verify? | Automated tests, manual testing, scan results |
| What changed after? | Before/after evidence |
| What are the limitations? | Be honest about remaining risks |
