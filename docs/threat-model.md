# Threat Model

## 1. Application Overview

SecureBlog is a multi-user blogging platform where users can create posts, comment, and interact. It has role-based access control (USER/ADMIN).

## 2. Assets

| Asset | Sensitivity | Description |
|---|---|---|
| User Accounts | HIGH | Email addresses, profile information |
| Password Hashes | CRITICAL | bcrypt-hashed passwords |
| JWT Secret | CRITICAL | Server signing key for all tokens |
| Blog Posts | MEDIUM | User-generated content |
| Comments | LOW-MEDIUM | User-generated content |
| Admin Functionality | HIGH | User management, content moderation |
| MongoDB Database | HIGH | All persistent application data |
| API Endpoints | MEDIUM | Application business logic |

## 3. Threat Actors

| Actor | Capability | Motivation |
|---|---|---|
| Anonymous Attacker | Network access, browser, basic tools | Curiosity, vandalism, data theft |
| Authenticated Malicious User | Valid account, API access, knowledge of API structure | Privilege escalation, content manipulation, abuse |
| Compromised Account | Valid credentials, full account access | Data exfiltration, impersonation |

## 4. STRIDE Analysis

### Spoofing (Identity)

| Threat | Target | Mitigation |
|---|---|---|
| Forged JWT tokens | Authentication | Algorithm restriction (HS256), strong secret, token expiration |
| Credential stuffing | Login endpoint | Rate limiting (5 req/15min), strong password requirements |
| Session hijacking | User sessions | HTTPS (production), HttpOnly cookies (future), token expiration |

### Tampering (Data Integrity)

| Threat | Target | Mitigation |
|---|---|---|
| Unauthorized post modification | Blog posts | Ownership checks + role authorization |
| Comment content manipulation | Comments | Input validation, ownership checks |
| Request parameter manipulation | API endpoints | Server-side validation, type checking |

### Repudiation (Deniability)

| Threat | Target | Mitigation |
|---|---|---|
| Unlogged admin actions | Admin operations | Security event logging with user IDs |
| Unlogged auth failures | Authentication | LOGIN_FAILURE events logged |
| Missing audit trail | All operations | Request IDs, structured logging |

### Information Disclosure

| Threat | Target | Mitigation |
|---|---|---|
| Stack trace exposure | Error responses | Generic client errors, internal logging |
| Technology fingerprinting | HTTP headers, responses | Remove X-Powered-By, limit info endpoints |
| User enumeration | Registration/login | Generic error messages (hardened) |
| Database error details | Error responses | Sanitized error handler |

### Denial of Service

| Threat | Target | Mitigation |
|---|---|---|
| Login brute force | Auth endpoints | Rate limiting (5/15min) |
| Comment flooding | Comment endpoints | Rate limiting (10/15min) |
| Large payload attacks | Body parsing | JSON body size limit (10MB) |
| API exhaustion | General API | General rate limiting (100/15min) |

### Elevation of Privilege

| Threat | Target | Mitigation |
|---|---|---|
| User accessing admin routes | Admin endpoints | Role-based middleware |
| User modifying others' posts | Post CRUD | Ownership checks |
| Algorithm confusion (CVE-2022-23541) | JWT verification | Explicit algorithm restriction |

## 5. Attack Surface

| Layer | Attack Surface | Security Controls | Threats | Testing |
|---|---|---|---|---|
| **Browser** | User input, cookies, localStorage | CSP, XSS protection | XSS, token theft | XSS payload tests |
| **Frontend** | React SPA, API calls | Safe rendering, input forms | DOM manipulation, XSS | Manual + automated XSS tests |
| **HTTP Transport** | Headers, CORS, methods | Security headers, CORS allowlist | MITM, clickjacking | Header scan |
| **API Gateway** | Route endpoints | Rate limiting, body parsing | DoS, oversized payloads | Rate limit tests |
| **Authentication** | Login, register, JWT | Password hashing, algorithm restriction | Credential attacks, token forgery | Auth tests |
| **Authorization** | Protected routes | Role checks, ownership validation | Privilege escalation | Authorization tests |
| **Business Logic** | CRUD operations | Input validation, sanitization | Injection, data corruption | Validation tests |
| **Database** | MongoDB queries | Mongoose ODM, schema validation | NoSQL injection | Input validation |

## 6. Risk Matrix

| Risk | Likelihood | Impact | Overall |
|---|---|---|---|
| XSS via stored content | HIGH (baseline) / LOW (hardened) | HIGH | CRITICAL (baseline) / LOW (hardened) |
| Authorization bypass | HIGH (baseline) / LOW (hardened) | HIGH | HIGH (baseline) / LOW (hardened) |
| Credential brute force | HIGH (baseline) / LOW (hardened) | MEDIUM | MEDIUM (baseline) / LOW (hardened) |
| Information disclosure | MEDIUM | LOW-MEDIUM | MEDIUM (baseline) / LOW (hardened) |
| Dependency vulnerability | PRESENT | MEDIUM | MEDIUM (baseline) / REMEDIATED (hardened) |
