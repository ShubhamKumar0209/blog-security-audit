# Review 1 — Problem Definition, Reconnaissance & Threat Model

## 1. Scenario Number & Problem Statement

**Scenario 1: Web Application Security Audit of a Blogging Platform**

**Problem Statement:**
The SecureBlog platform exhibits multiple severe security vulnerabilities across its application stack, including Broken Access Control, Cross-Site Scripting (XSS), and vulnerable dependencies. This project aims to identify, exploit, and remediate these flaws to ensure data confidentiality, integrity, and availability. We perform a comprehensive security audit involving reconnaissance, threat modeling, exploitation of vulnerabilities, and implementation of robust defense mechanisms to protect sensitive user data and administrative functionalities.

**Team Role Split:**
*   **Alice:** Frontend Development & Remediation
*   **Bob:** Backend API & Database Hardening
*   **Charlie:** Exploit Development & Penetration Testing
*   **Dave:** Defense Implementation (Middleware, Headers, Rate Limiting)
*   **Eve:** Reporting, Threat Modeling, & Documentation

## 2. Architecture Diagram

The following architecture diagram outlines the hardened state of the application, explicitly marking trust boundaries and authentication flows.

```text
┌─────────┐
│ Browser │
└────┬────┘
     │  [Trust Boundary: Client-Side Security Headers]
     │  CSP, X-Content-Type-Options, Referrer-Policy
     │  X-Frame-Options, Permissions-Policy
     ▼
┌─────────────────────────────┐
│ Security Headers            │ 
│ (CSP, XCTO, RP, PP, XFO)    │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ Frontend (React SPA)        │
│ - Safe text rendering       │ 
│ - No dangerouslySetInnerHTML│
│ - Source maps disabled      │
└────────────┬────────────────┘
             │  [Trust Boundary: Network to Application Gateway]
             ▼
┌─────────────────────────────────────────────────┐
│ API Layer                                       │
│                                                 │
│  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ Request ID   │→ │ Security Headers         │ │
│  └──────────────┘  └──────────┬───────────────┘ │
│                               │                 │
│  ┌──────────────┐  ┌──────────▼───────────────┐ │
│  │ CORS         │→ │ Rate Limiting            │ │
│  │ (explicit    │  │ Auth: 5/15min            │ │
│  │  origin)     │  │ General: 100/15min       │ │
│  └──────────────┘  └──────────┬───────────────┘ │
│                               │                 │
│  ┌──────────────┐  ┌──────────▼───────────────┐ │
│  │ Body Parsing │→ │ Input Validation         │ │
│  └──────────────┘  │ Type, length, format     │ │
│                    └──────────┬───────────────┘ │
│                               │  [Trust Boundary: Auth Enforcement]
│  ┌──────────────┐  ┌──────────▼───────────────┐ │
│  │ Authentication│→ │ Authorization            │ │
│  │ JWT + HS256   │  │ Role + Ownership         │ │
│  │ algorithm pin │  │                          │ │
│  └──────────────┘  └──────────┬───────────────┘ │
│                               │                 │
│  ┌──────────────┐  ┌──────────▼───────────────┐ │
│  │ Controller   │→ │ Error Handler            │ │
│  │ (business    │  │ Generic client messages  │ │
│  │  logic)      │  │ Detailed internal logs   │ │
│  └──────────────┘  └──────────────────────────┘ │
│                                                 │
└───────────────────────┬─────────────────────────┘
                        │  [Trust Boundary: Internal Network]
                        ▼
┌─────────────────────────────┐
│ Validated Database Access   │
│ (Mongoose ODM, schema       │
│  validation)                │
└────────────┬────────────────┘
             │  [Trust Boundary: Database Storage]
             ▼
┌─────────────────────────────┐
│ MongoDB                     │
└─────────────────────────────┘

         ┌────────────────────────────┐
         │ Security Logging           │ 
         │ (LOGIN, AUTH_FAIL, RATE    │
         │  LIMIT, VALIDATION, ADMIN) │
         │ With request IDs           │
         └────────────────────────────┘
```

## 3. Attack-Surface Inventory

| Method | Path | Parameters | Auth Required (Y/N) | Data Sensitivity |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/admin/users` | None | Y | HIGH |
| **GET** | `/api/admin/stats` | None | Y | HIGH |
| **DELETE** | `/api/admin/posts/:id` | `id` | Y | HIGH |
| **DELETE** | `/api/admin/comments/:id` | `id` | Y | HIGH |
| **DELETE** | `/api/admin/users/:id` | `id` | Y | HIGH |
| **GET** | `/api/posts/` | None | N | MEDIUM |
| **GET** | `/api/posts/search` | `query` (query string) | N | MEDIUM |
| **GET** | `/api/posts/:id` | `id` | N | MEDIUM |
| **POST** | `/api/posts/` | `body` (title, content) | Y | MEDIUM |
| **PUT** | `/api/posts/:id` | `id`, `body` | Y | MEDIUM |
| **DELETE** | `/api/posts/:id` | `id` | Y | MEDIUM |
| **GET** | `/api/comments/:postId` | `postId` | N | LOW-MEDIUM |
| **POST** | `/api/comments/:postId` | `postId`, `body` (text) | Y | LOW-MEDIUM |
| **DELETE** | `/api/comments/:commentId` | `commentId` | Y | LOW-MEDIUM |
| **POST** | `/api/auth/register` | `body` (email, password, etc) | N | HIGH |
| **POST** | `/api/auth/login` | `body` (email, password) | N | HIGH |
| **POST** | `/api/auth/logout` | None | N | LOW |
| **POST** | `/api/auth/refresh` | Cookie (`refreshToken`) | N | HIGH |
| **GET** | `/api/auth/profile` | None | Y | HIGH |

## 4. Literature / CVE Survey

1. **CVE-2022-23541 — jsonwebtoken Algorithm Confusion:** 
   *Source: NIST NVD* ([Link](https://nvd.nist.gov/vuln/detail/CVE-2022-23541))
   When `jwt.verify()` is called without specifying allowed algorithms, it enables an attacker to forge tokens by exploiting algorithm confusion. Our backend originally suffered from this by not restricting the signing algorithm, allowing asymmetric-signed tokens to bypass the HS256 requirement.

2. **CVE-2024-43796 — Express XSS in res.redirect():**
   *Source: NIST NVD* ([Link](https://nvd.nist.gov/vuln/detail/CVE-2024-43796))
   This vulnerability highlights that `response.redirect()` in older versions of Express generates an HTML body containing the redirect URL as a clickable link. If the URL contains an XSS payload, it can be reflected in the HTML response.

3. **OWASP Top 10:2021-A01 - Broken Access Control:**
   *Source: OWASP* ([Link](https://owasp.org/Top10/A01_2021-Broken_Access_Control/))
   The application's initial state lacked role verification on administrative endpoints and ownership checks on post modification (V-07), directly mapping to this category. We mitigated this by enforcing role-based middleware (`/api/admin/*`) and ownership matching for CRUD operations.

4. **OWASP Top 10:2021-A03 - Injection (Cross-Site Scripting):**
   *Source: OWASP* ([Link](https://owasp.org/Top10/A03_2021-Injection/))
   The frontend originally used `dangerouslySetInnerHTML` for rendering blog content without sanitization (V-04). This allowed stored XSS attacks, compromising user sessions and data integrity.

5. **CWE-209: Generation of Error Message Containing Sensitive Information:**
   *Source: MITRE* ([Link](https://cwe.mitre.org/data/definitions/209.html))
   Prior to hardening, the server returned verbose error responses including stack traces and database structure details (V-06). This aided attacker reconnaissance and fingerprinting, leading us to implement a generic error handler that logs detailed errors internally while presenting sanitized messages to clients.
