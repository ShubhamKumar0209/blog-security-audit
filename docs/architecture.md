# Architecture

## Before — Security Baseline

```
┌─────────┐
│ Browser │
└────┬────┘
     │  No CSP, no security headers
     │  X-Powered-By: Express exposed
     ▼
┌─────────────────────────────┐
│ Frontend (React SPA)        │
│ - dangerouslySetInnerHTML   │ ← V-04: XSS vulnerability
│ - Source maps exposed       │ ← Aids fingerprinting
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ Backend (Express)           │
│ ┌─────────────────────────┐ │
│ │ CORS: * (permissive)    │ │
│ │ No rate limiting        │ │ ← V-05
│ │ No input validation     │ │ ← V-03
│ │ No ownership checks     │ │ ← V-07
│ │ Verbose error responses │ │ ← V-06
│ │ jsonwebtoken@8.5.1      │ │ ← V-01: CVE-2022-23541
│ │ express@4.19.2          │ │ ← V-08: CVE-2024-43796
│ │ No security headers     │ │ ← V-02
│ └─────────────────────────┘ │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ MongoDB                     │
│ (No additional protections) │
└─────────────────────────────┘
```

## After — Hardened Architecture

```
┌─────────┐
│ Browser │
└────┬────┘
     │  CSP, X-Content-Type-Options, Referrer-Policy
     │  X-Frame-Options, Permissions-Policy
     ▼
┌─────────────────────────────┐
│ Security Headers            │ ← SEC-004
│ (CSP, XCTO, RP, PP, XFO)   │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ Frontend (React SPA)        │
│ - Safe text rendering       │ ← V-04 fixed
│ - No dangerouslySetInnerHTML│
│ - Source maps disabled      │
└────────────┬────────────────┘
             │
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
│                               │                 │
│  ┌──────────────┐  ┌──────────▼───────────────┐ │
│  │ Authentication│→ │ Authorization            │ │
│  │ JWT + HS256   │  │ Role + Ownership         │ │
│  │ algorithm pin │  │                          │ │
│  └──────────────┘  └──────────┬───────────────┘ │
│                               │                 │
│  ┌──────────────┐  ┌──────────▼───────────────┐ │
│  │ Controller   │→ │ Error Handler            │ │
│  │ (business    │  │ Generic client messages   │ │
│  │  logic)      │  │ Detailed internal logs    │ │
│  └──────────────┘  └──────────────────────────┘ │
│                                                 │
└───────────────────────┬─────────────────────────┘
                        │
                        ▼
┌─────────────────────────────┐
│ Validated Database Access   │
│ (Mongoose ODM, schema       │
│  validation)                │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ MongoDB                     │
└─────────────────────────────┘

         ┌────────────────────────────┐
         │ Security Logging           │ ← Cross-cutting concern
         │ (LOGIN, AUTH_FAIL, RATE    │
         │  LIMIT, VALIDATION, ADMIN) │
         │ With request IDs           │
         └────────────────────────────┘
```

## Middleware Pipeline Ordering

The ordering of middleware is critical. Here's why each layer is positioned where it is:

| Order | Middleware | Why This Position |
|---|---|---|
| 1 | Request ID | Must be first — all subsequent logs need the correlation ID |
| 2 | Security Headers | Applies to ALL responses, including errors and rate-limit rejections |
| 3 | CORS | Reject disallowed origins BEFORE processing the request body |
| 4 | Rate Limiting | Reject excessive requests BEFORE parsing body (saves CPU) |
| 5 | Body Parsing | Parse JSON/URL-encoded body for validation |
| 6 | Input Validation | Validate BEFORE authentication — reject bad input early |
| 7 | Authentication | Establish identity BEFORE checking permissions |
| 8 | Authorization | Check permissions BEFORE executing business logic |
| 9 | Controller | Execute business logic with validated, authorized request |
| 10 | Error Handler | Catch ALL unhandled errors, format safe response |
