# Remediation

## Dependency Upgrades

### jsonwebtoken: 8.5.1 → 9.0.2

```
Vulnerable Version: 8.5.1
CVE: CVE-2022-23541
Fixed Version: 9.0.0 (we upgrade to 9.0.2 for latest patches)
Reason: Version 9.0.0 contains the fix for algorithm confusion vulnerability.
Source: https://github.com/auth0/node-jsonwebtoken/security/advisories/GHSA-hjrf-2m68-5959
```

Additionally, the hardened code explicitly specifies `algorithms: ['HS256']` as a defense-in-depth measure.

### express: 4.19.2 → 4.21.1

```
Vulnerable Version: 4.19.2
CVE: CVE-2024-43796
Fixed Version: 4.20.0 (we upgrade to 4.21.1 for latest patches)
Reason: Version 4.20.0 properly encodes URLs in res.redirect() HTML output.
Source: https://github.com/expressjs/express/security/advisories/GHSA-qw6h-vgh9-j6wx
```

## Security Controls Added

| Control | File | Purpose |
|---|---|---|
| Security Headers | `server/src/middleware/securityHeaders.js` | CSP, XCTO, RP, PP, XFO |
| Rate Limiting | `server/src/middleware/rateLimiter.js` | Prevent brute-force and flooding |
| Input Validation | `server/src/middleware/validate.js` | Type, length, format checks |
| Authorization | Post/Comment controllers | Ownership + role checks |
| Error Handler | `server/src/middleware/errorHandler.js` | Generic client errors |
| Security Logger | `server/src/utils/securityLogger.js` | Structured security events |
| HTML Sanitizer | `server/src/utils/sanitizer.js` | XSS prevention for stored content |
| CORS Restriction | `server/src/app.js` | Explicit origin allowlist |

## Verification Steps

For each remediation:

1. **Dependency upgrade** → `npm audit` shows 0 vulnerabilities
2. **Security headers** → Header scan confirms all headers present
3. **Rate limiting** → 6+ rapid auth requests trigger 429
4. **Input validation** → Invalid/oversized input returns 400
5. **Authorization** → User cannot modify other user's content (403)
6. **Error handling** → No stack traces in responses
7. **XSS** → `<script>` payload rendered as text, not executed
8. **CORS** → Requests from non-allowed origins rejected
