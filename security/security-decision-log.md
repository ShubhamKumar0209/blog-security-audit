# Security Decision Log

Every security decision in this project is recorded here with reasoning.

---

## Decision SEC-001: Authentication Method

- **Date:** August 2026
- **Component:** Authentication
- **Decision:** Use JWT (JSON Web Tokens) for stateless authentication.
- **Reason:** JWT enables stateless authentication without server-side session storage, simplifying horizontal scaling and reducing database load.
- **Threat:** Session hijacking, token forgery.
- **Alternative considered:** Server-side sessions with cookies.
- **Chosen approach:** JWT with HS256 signing, 24h expiration.
- **Trade-off:** JWT tokens cannot be individually revoked without a blacklist. A short expiration (24h) limits the window of exposure if a token is compromised.
- **Verification:** Login/logout flow tested. Expired tokens correctly rejected.
- **Result:** Stateless authentication working. Token expiration enforced.

---

## Decision SEC-002: Password Hashing

- **Date:** August 2026
- **Component:** Authentication
- **Decision:** Use bcrypt with cost factor 12 for password hashing.
- **Reason:** bcrypt is a purpose-built password hashing algorithm that is intentionally slow, making brute-force attacks computationally expensive.
- **Threat:** Credential database compromise → offline password cracking.
- **Alternative considered:** SHA-256, scrypt, argon2.
- **Chosen approach:** bcrypt (widely supported, well-tested, available via npm).
- **Trade-off:** Higher cost factor = slower login (12 is a reasonable balance for 2026 hardware).
- **Verification:** Passwords stored as hashes. Original passwords not recoverable.
- **Result:** Passwords securely hashed with bcrypt.

---

## Decision SEC-003: JWT Algorithm Restriction

- **Date:** August 2026
- **Component:** Authentication
- **Decision:** Explicitly specify `algorithms: ['HS256']` in `jwt.verify()`.
- **Reason:** CVE-2022-23541 demonstrates that omitting the algorithms option can lead to algorithm confusion attacks.
- **Threat:** Token forgery via algorithm confusion.
- **Alternative considered:** Accept default behavior (not safe).
- **Chosen approach:** Explicitly restrict to HS256 only.
- **Trade-off:** None — this is a strict security improvement with no functional cost.
- **Verification:** Tokens signed with other algorithms are rejected.
- **Result:** Algorithm confusion attack vector closed.

---

## Decision SEC-004: Security Headers (Helmet-equivalent)

- **Date:** August 2026
- **Component:** HTTP Transport
- **Decision:** Implement custom security headers middleware (CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options).
- **Reason:** Missing security headers (V-02) leave the application vulnerable to XSS, clickjacking, MIME confusion, and information leakage.
- **Threat:** XSS, clickjacking, MIME sniffing attacks.
- **Alternative considered:** Using the `helmet` npm package.
- **Chosen approach:** Custom middleware to demonstrate understanding of each header's purpose.
- **Trade-off:** Custom code requires maintenance. Helmet auto-updates with best practices.
- **Verification:** Header scan confirms all appropriate headers present.
- **Result:** Security headers active in hardened mode.

---

## Decision SEC-005: No HSTS

- **Date:** August 2026
- **Component:** HTTP Transport
- **Decision:** Do NOT enable HSTS (Strict-Transport-Security).
- **Reason:** This is an HTTP-only development environment. HSTS forces HTTPS and would break the application without TLS configuration.
- **Threat:** MITM attacks (not mitigated in dev — accepted risk).
- **Alternative considered:** Setting up self-signed certificates.
- **Chosen approach:** Skip HSTS, document the decision.
- **Trade-off:** No MITM protection in dev. Acceptable for local lab.
- **Verification:** N/A.
- **Result:** HSTS correctly omitted for HTTP-only setup.

---

## Decision SEC-006: Rate Limiting

- **Date:** August 2026
- **Component:** API Protection
- **Decision:** Implement rate limiting: 5 req/15min for auth, 100 req/15min for general API.
- **Reason:** Without rate limiting (V-05), attackers can brute-force credentials, spam registrations, and flood endpoints.
- **Threat:** Credential brute-force, denial of service, comment spam.
- **Alternative considered:** express-rate-limit package, Redis-backed limiter.
- **Chosen approach:** Custom in-memory rate limiter for simplicity.
- **Trade-off:** In-memory storage resets on server restart. Redis would persist across restarts.
- **Verification:** Repeated auth requests trigger 429 after 5 attempts.
- **Result:** Rate limiting active in hardened mode.

---

## Decision SEC-007: Input Validation

- **Date:** August 2026
- **Component:** Data Integrity
- **Decision:** Implement server-side validation for all API inputs with type checks, length limits, required fields, and format patterns.
- **Reason:** Weak validation (V-03) allows malformed data, oversized payloads, and potential injection vectors.
- **Threat:** Data corruption, resource exhaustion, injection attacks.
- **Alternative considered:** Client-side validation only.
- **Chosen approach:** Server-side validation middleware. Client-side validation is a UX feature, not a security control.
- **Trade-off:** Additional server processing per request. Negligible performance impact.
- **Verification:** Tests confirm invalid input returns 400 with descriptive errors.
- **Result:** All API endpoints validate input in hardened mode.

---

## Decision SEC-008: XSS Mitigation

- **Date:** August 2026
- **Component:** Output Safety
- **Decision:** Use safe text rendering (no `dangerouslySetInnerHTML`), CSP, and server-side sanitization.
- **Reason:** The baseline renders user content as raw HTML (V-04), enabling stored XSS.
- **Threat:** Stored Cross-Site Scripting — attacker-controlled JavaScript execution in victim's browser.
- **Alternative considered:** Input validation only.
- **Chosen approach:** Defense-in-depth: validation + sanitization + safe rendering + CSP.
- **Trade-off:** Rich HTML formatting is lost in safe text mode. Sanitized HTML could be used for blog posts.
- **Verification:** XSS payload `<script>alert("XSS")</script>` no longer executes in hardened mode.
- **Result:** XSS mitigated through multiple layers.

---

## Decision SEC-009: Authorization (Ownership Checks)

- **Date:** August 2026
- **Component:** Access Control
- **Decision:** Implement resource ownership validation in addition to role-based access control.
- **Reason:** Authentication answers "Who are you?" Authorization answers "Are you allowed to do this?" The baseline (V-07) only checks authentication, not ownership.
- **Threat:** Horizontal privilege escalation — user A modifies user B's content.
- **Alternative considered:** Role-based only (insufficient).
- **Chosen approach:** Role-based access + per-resource ownership checks.
- **Trade-off:** Additional database query to verify ownership. Minimal performance impact.
- **Verification:** Tests confirm users cannot modify other users' posts.
- **Result:** Authorization enforced at both role and resource level.

---

## Decision SEC-010: Error Handling

- **Date:** August 2026
- **Component:** Error Management
- **Decision:** Return generic error messages to clients. Log detailed errors internally with request IDs.
- **Reason:** Verbose errors (V-06) expose stack traces, file paths, and database details.
- **Threat:** Information disclosure — attackers learn about internal architecture.
- **Alternative considered:** Full error details in development only.
- **Chosen approach:** Generic client errors always. Detailed internal logs with correlation IDs.
- **Trade-off:** Harder to debug client-side. Request IDs enable server-side investigation.
- **Verification:** Error responses contain no stack traces or internal paths in hardened mode.
- **Result:** Error handling hardened.

---

## Decision SEC-011: CORS

- **Date:** August 2026
- **Component:** Cross-Origin Resource Sharing
- **Decision:** Use explicit origin allowlist (`CLIENT_URL` only) instead of wildcard `*`.
- **Reason:** Wildcard CORS on authenticated APIs allows any website to make credentialed requests.
- **Threat:** Cross-origin data theft from authenticated sessions.
- **Alternative considered:** `Access-Control-Allow-Origin: *` (insecure for auth APIs).
- **Chosen approach:** Explicit origin: `http://localhost:5173`.
- **Trade-off:** Only the configured client URL can access the API. Additional clients require config changes.
- **Verification:** Requests from non-allowed origins are rejected.
- **Result:** CORS restricted to authorized client origin.

---

## Decision SEC-012: Dependency Management

- **Date:** August 2026
- **Component:** Supply Chain
- **Decision:** Upgrade vulnerable dependencies after CVE identification and risk assessment.
- **Reason:** CVE-2022-23541 (jsonwebtoken) and CVE-2024-43796 (express) are present in baseline.
- **Threat:** Known vulnerability exploitation.
- **Alternative considered:** Keep vulnerable versions with compensating controls only.
- **Chosen approach:** Upgrade to fixed versions AND add compensating controls (belt and suspenders).
- **Trade-off:** Package upgrades may introduce breaking changes. Testing required.
- **Verification:** `npm audit` shows no known vulnerabilities after upgrade.
- **Result:** Dependencies upgraded. CVEs remediated.

---

## Decision SEC-013: Security Logging

- **Date:** August 2026
- **Component:** Monitoring & Audit
- **Decision:** Log security-relevant events (LOGIN_SUCCESS, LOGIN_FAILURE, AUTHORIZATION_FAILURE, etc.) with structured metadata.
- **Reason:** Without security logging, security incidents cannot be detected or investigated.
- **Threat:** Undetected attacks, inability to perform forensic analysis.
- **Alternative considered:** Standard application logging only.
- **Chosen approach:** Dedicated security event logger with predefined event types and correlation IDs.
- **Trade-off:** Log volume increases. Requires log management strategy.
- **Verification:** Security events appear in logs with correct metadata.
- **Result:** Security logging implemented.

---

## Decision SEC-014: Request IDs

- **Date:** August 2026
- **Component:** Observability
- **Decision:** Assign UUID-based request IDs to every incoming request.
- **Reason:** Without request IDs, correlating logs across middleware layers is impossible.
- **Threat:** Inability to trace attack sequences or debug issues.
- **Alternative considered:** IP-based correlation (insufficient — NAT, proxies).
- **Chosen approach:** UUID v4 per request, included in all logs and error responses.
- **Trade-off:** Minimal overhead (UUID generation is fast).
- **Verification:** All log entries include requestId.
- **Result:** Request correlation enabled.

---

## Decision SEC-015: Environment Variables

- **Date:** August 2026
- **Component:** Configuration
- **Decision:** Store secrets in environment variables, never in source code.
- **Reason:** Hardcoded secrets in source code are exposed via version control.
- **Threat:** Secret exposure through code repositories.
- **Alternative considered:** Config files (risk of accidental commit).
- **Chosen approach:** `.env` files excluded from git. `.env.example` as template.
- **Trade-off:** Developers must set up `.env` manually.
- **Verification:** No real secrets in committed code. `.env` in `.gitignore`.
- **Result:** Secrets separated from source code.

---

## Decision SEC-016: Access/Refresh Token Architecture

- **Date:** August 2026
- **Component:** Authentication
- **Decision:** Implement a dual-token architecture: Short-lived Access Token (JSON payload) + Long-lived Refresh Token (`HttpOnly` cookie + DB).
- **Reason:** A single, long-lived JWT stored in localStorage is highly vulnerable to XSS and cannot be revoked server-side without a blocklist.
- **Threat:** Persistent account takeover via XSS token theft; inability to revoke compromised sessions.
- **Alternative considered:** Single JWT (used in baseline), stateful server sessions.
- **Chosen approach:** Access tokens (15m) for stateless API speed, Refresh tokens (7d) for UX and revocability.
- **Trade-off:** Significant architectural complexity (Axios interceptors, `HttpOnly` cross-origin cookies, DB tracking).
- **Verification:** `HttpOnly` cookie is set on login. Axios auto-refreshes expired access tokens. Logout revokes the token in DB.
- **Result:** Industry-standard secure token lifecycle implemented.
