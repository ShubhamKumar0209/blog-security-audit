# Framework Fingerprinting

## What is Framework Fingerprinting?

Framework fingerprinting is the process of identifying the technologies (frameworks, libraries, runtimes) used by a web application. Attackers use this to find version-specific vulnerabilities.

## Passive vs Active Fingerprinting

### Passive Fingerprinting
- Examines information available in normal responses
- Does not send special or unusual requests
- Examples: reading HTTP headers, examining HTML content, observing error messages
- **Harder to detect** — looks like normal traffic

### Active Fingerprinting
- Sends crafted requests designed to elicit identifying responses
- Examples: probing known framework endpoints, sending malformed input, requesting source maps
- **Easier to detect** — unusual request patterns

## Signals Used

| Signal | Type | Identifies | Confidence |
|---|---|---|---|
| `X-Powered-By` header | Passive | Backend framework (Express) | HIGH for framework, LOW for version |
| HTML `<div id="root">` | Passive | React SPA | MEDIUM (not unique to React) |
| `<script type="module" src="/src/main.jsx">` | Passive | Vite + React dev mode | HIGH |
| `/api/info` response | Active | Runtime, database | HIGH (if endpoint exists) |
| Error response format | Active | Framework error handling | MEDIUM |
| `package.json` | Local audit | Exact versions | HIGH (requires filesystem access) |
| Source maps | Active (dev only) | Full source code, versions | HIGH (dev environments only) |

## Limitations

1. **Header-based detection can be defeated** by removing/spoofing headers
2. **Framework detection ≠ version detection** — identifying "Express" does not reveal "4.19.2"
3. **Bundled JavaScript** changes between versions and build configurations
4. **Source maps** are only available in development — not in production builds
5. **API info endpoints** would not exist in production applications
6. **Version strings** can be spoofed in responses

## Why It Matters

Once an attacker identifies the framework and version:
1. They search CVE databases for known vulnerabilities
2. They use version-specific exploit tools
3. They can target known weaknesses in that exact version

**Reducing technology disclosure** is a form of defense in depth — it makes the attacker's job harder but does NOT prevent attacks from a determined adversary.
