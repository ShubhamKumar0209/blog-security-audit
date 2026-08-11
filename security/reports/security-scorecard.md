# Security Scorecard

**Application:** Blog Security Audit
**Date:** August 2026

## Before vs After Comparison

| Category | Before (Baseline) | After (Hardened) | Change |
|---|---|---|---|
| **Dependency Security** | 🔴 Poor — 2 known CVEs | 🟢 Improved — CVEs remediated | Upgraded jsonwebtoken 8.5.1→9.0.2, express 4.19.2→4.21.1 |
| **HTTP Security Headers** | 🔴 Poor — No security headers, X-Powered-By exposed | 🟢 Strong — CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options active | Added all appropriate headers |
| **Authentication** | 🟡 Medium — JWT works but no algorithm restriction | 🟢 Strong — Explicit algorithm, strong password requirements | Algorithm pinning, password policy |
| **Authorization** | 🔴 Poor — No ownership checks on posts/comments | 🟢 Strong — Role-based + ownership validation | Added per-resource authorization |
| **Input Validation** | 🔴 Poor — No length limits, no type checks, no patterns | 🟢 Strong — Comprehensive validation on all inputs | Added validation middleware |
| **XSS Protection** | 🔴 Poor — dangerouslySetInnerHTML, no CSP | 🟢 Strong — Safe rendering, CSP, output encoding | Removed dangerous rendering |
| **Rate Limiting** | 🔴 Poor — No rate limiting on any endpoint | 🟢 Strong — Auth: 5/15min, General: 100/15min | Added per-route rate limiters |
| **Error Handling** | 🔴 Poor — Stack traces, paths, DB errors exposed | 🟢 Strong — Generic client messages, detailed internal logs | Separated internal/external error info |
| **Framework Exposure** | 🔴 High — X-Powered-By, /api/info, version details | 🟢 Reduced — Headers removed, info endpoint limited | Reduced technology disclosure |
| **Security Logging** | 🔴 Poor — Minimal console.log | 🟢 Improved — Structured events with request IDs | Added security event logging |

## Scoring Methodology

This scorecard uses qualitative assessments rather than fabricated numerical scores.

Ratings are based on:
- **Presence/absence of security controls** (verified through automated tests)
- **Alignment with OWASP guidelines**
- **Actual evidence from security scans**

> **Note:** Scores like "Strong" mean the control is implemented and tested.
> They do NOT mean the application is immune to all attacks in that category.
> Security is about reducing risk, not eliminating it.

## Risk Rating System

| Rating | Meaning |
|---|---|
| 🔴 Poor | Control absent or significantly insufficient |
| 🟡 Medium | Partial controls, some gaps remain |
| 🟢 Strong | Controls implemented and verified |
| 🟢 Improved | Measurable improvement from baseline |

> **CVSS vs Application Risk:** A CVSS score measures the intrinsic severity of a vulnerability. Application risk also considers the deployment context, data sensitivity, exposure, and compensating controls. These are not the same thing.
