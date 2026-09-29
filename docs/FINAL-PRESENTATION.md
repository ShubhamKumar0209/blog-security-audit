# SecureBlog — Web Application Security Audit
## End-to-End Implementation Guide & Presentation Reference

---

## 📋 Project Overview

**SecureBlog** is a full-stack blogging platform built **intentionally** with controlled security vulnerabilities, then hardened systematically — demonstrating the complete security audit lifecycle:

```
Build → Fingerprint → Identify → Map CVEs → Assess Risk → Demo → Remediate → Verify
```

### Dual-Instance Architecture

The project runs **two simultaneous instances** for live side-by-side comparison:

| Instance | Frontend | Backend | Security Mode |
|---|---|---|---|
| 🔓 **Baseline** (Vulnerable) | `http://localhost:5173` | `http://localhost:5001` | All vulnerabilities active |
| 🔒 **Hardened** (Secure) | `http://localhost:5174` | `http://localhost:5002` | All security controls active |

Both instances share the **same codebase** and **same database** — the only difference is the `SECURITY_MODE` environment variable (`baseline` vs `hardened`), which toggles security controls at runtime.

---

## 🎯 MUST-HAVES FOR YOUR PPT (Slide Deck Outline)

To make your presentation highly impactful, structure your slides around these core themes:

**Slide 1: Title & Project Mission**
- Name: SecureBlog - Full-Stack Security Audit
- Goal: Demonstrate real-world vulnerabilities and remediation using a unique dual-mode application architecture.

**Slide 2: The Architecture & "Dual-Mode" Innovation**
- Explain the setup: One codebase, two runtime modes (Baseline vs. Hardened).
- Highlight that this allows live side-by-side comparison, making the audit tangible.
- *Visual:* Include the flow from the "After (Hardened) Architecture" section below.

**Slide 3: The Threat Landscape (The 8 Vulnerabilities)**
- Group the 8 vulnerabilities logically:
  - **Dependency Flaws:** CVE-2022-23541 (JWT Algorithm Confusion) & CVE-2024-43796 (Express XSS).
  - **Injection & Logic Flaws:** Stored XSS (V-04) & Broken Authorization / IDOR (V-07).
  - **Misconfigurations:** Missing Headers (V-02), Verbose Errors (V-06), No Rate Limiting (V-05), Weak Validation (V-03).

**Slide 4: Deep Dive — Stored XSS (V-04)**
- *Concept:* Unsanitized user input executes malicious code in victims' browsers.
- *Remediation:* Implemented `DOMPurify` for server/client sanitization and Content Security Policy (CSP).
- *(Note: Prepare to live-demo this using the `<img src="x" onerror="alert('XSS Demo')">` payload).*

**Slide 5: Deep Dive — Broken Authorization / IDOR (V-07)**
- *Concept:* Authentication is not Authorization. In baseline, any user can delete anyone else's post.
- *Remediation:* Added strict backend resource ownership checks and Role-Based Access Control (Admin overrides).

**Slide 6: Deep Dive — Dependency CVEs (V-01)**
- Highlight **CVE-2022-23541**: Algorithm confusion in `jsonwebtoken`.
- *Key Takeaway:* Explain that raw CVSS scores (5.0 Medium) require context. We mitigated it fundamentally by pinning `algorithms: ['HS256']` in the code, rather than just bumping a version number.

**Slide 7: Defense in Depth (Conclusion)**
- Security is layered. One control failing shouldn't compromise the app.
- Show the Hardened Middleware pipeline: Request ID → CSP Headers → CORS → Rate Limiter → Input Validation → Authentication → Authorization.

---

## 🏗️ Technology Stack

### Core Technologies

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend** | React | 18.2.0 | Single Page Application (SPA) |
| **Build Tool** | Vite | 5.0.0 | Fast development server + HMR |
| **Routing** | React Router | 6.20.0 | Client-side routing |
| **HTTP Client** | Axios | 1.6.2 | API communication with interceptors |
| **Backend** | Express.js | 4.21.1 (hardened) / 4.19.2 (baseline) | REST API server |
| **Database** | MongoDB Atlas | 7.x | NoSQL cloud database |
| **ODM** | Mongoose | 7.6.3 | Schema validation + query building |
| **Authentication** | JSON Web Tokens | 9.0.2 (hardened) / 8.5.1 (baseline) | Stateless auth with access + refresh tokens |
| **Password Hashing** | bcrypt | 5.1.1 | Adaptive password hashing (12 salt rounds) |

### Security Libraries (Hardened Mode)

| Library | Version | Purpose |
|---|---|---|
| **Helmet** | 8.3.0 | Comprehensive HTTP security headers (CSP, XCTO, XFO, etc.) |
| **express-rate-limit** | 8.7.0 | Rate limiting (brute-force / DoS protection) |
| **express-validator** | 7.3.2 | Server-side input validation middleware |
| **DOMPurify** | 3.4.15 | HTML sanitization (XSS prevention) |
| **jsdom** | 30.1.0 | DOM environment for server-side DOMPurify |
| **uuid** | 9.0.0 | Request ID generation for log correlation |
| **cookie-parser** | 1.4.6 | Secure cookie handling for refresh tokens |

### Design & Styling

| Aspect | Approach |
|---|---|
| **Design Language** | Premium dark theme with glassmorphism |
| **Typography** | Inter (Google Fonts) — weights 300–800 |
| **Color System** | HSL-based custom properties with gradient accents |
| **Animations** | CSS micro-animations (fade-in, pulse-glow, spin) |
| **Layout** | CSS Grid + Flexbox responsive layout |

---

## 🔍 Vulnerability Register (8 Vulnerabilities)

### CVE-Based Vulnerabilities (Real, NVD-Verified)

| ID | CVE | Package | CVSS | Description | Remediation |
|---|---|---|---|---|---|
| **V-01** | CVE-2022-23541 | jsonwebtoken ≤ 8.5.1 | 5.0 / 6.3 MEDIUM | JWT algorithm confusion — `jwt.verify()` without `algorithms` option allows algorithm manipulation | Upgrade to 9.0.2 + pin `algorithms: ['HS256']` |
| **V-08** | CVE-2024-43796 | express < 4.20.0 | 5.0 MEDIUM | XSS in `res.redirect()` — untrusted input reflected in HTML response body | Upgrade to express 4.21.1 |

### Application-Level Vulnerabilities

| ID | Vulnerability | Severity | Baseline Behavior | Hardened Fix |
|---|---|---|---|---|
| **V-02** | Missing Security Headers | MEDIUM | No CSP, no XCTO, no XFO, `X-Powered-By: Express` exposed | Helmet middleware: CSP, XCTO, XFO, Referrer-Policy, Permissions-Policy, X-Powered-By removed |
| **V-03** | Weak Input Validation | MEDIUM | No password strength, no length limits, no format validation | express-validator: min 8 chars, uppercase/lowercase/number/special required, length limits on all fields |
| **V-04** | Stored XSS | HIGH | `dangerouslySetInnerHTML` renders user content as raw HTML — `<script>` tags execute | DOMPurify sanitization on server + client, CSP blocks inline scripts |
| **V-05** | No Rate Limiting | MEDIUM | Unlimited login/register/comment attempts (brute-force possible) | 5 auth/15min, 100 general/15min, 10 comments/15min + HTTP 429 with Retry-After |
| **V-06** | Verbose Error Disclosure | LOW-MEDIUM | Stack traces, file paths, DB error codes exposed in HTTP responses | Generic client messages + structured internal logs with request ID correlation |
| **V-07** | Broken Authorization (IDOR) | HIGH | Any authenticated user can update/delete ANY post or comment | Resource ownership checks + admin override for moderation |

---

## 🏛️ Architecture

### Middleware Pipeline (Hardened Mode)

The middleware ordering is security-critical — each layer depends on the ones before it:

```
Request
  │
  ├─1→ Request ID         (correlation ID for all logs)
  ├─2→ Security Headers   (applies to ALL responses including errors)
  ├─3→ CORS               (reject disallowed origins BEFORE processing)
  ├─4→ Rate Limiting       (reject excessive requests BEFORE parsing body)
  ├─5→ Body Parsing        (parse JSON for validation)
  ├─6→ Input Validation    (reject bad input BEFORE auth)
  ├─7→ Authentication      (establish identity via JWT)
  ├─8→ Authorization       (check permissions + ownership)
  ├─9→ Controller          (execute business logic)
  └─10→ Error Handler      (catch ALL unhandled errors, safe response)
```

### Before (Baseline) Architecture

```
Browser → No CSP, no headers → React SPA (dangerouslySetInnerHTML, source maps)
                                    ↓
                              Express Backend
                              ├── CORS: * (permissive)
                              ├── No rate limiting
                              ├── No input validation
                              ├── No ownership checks
                              ├── Verbose error responses
                              ├── jsonwebtoken@8.5.1 (CVE-2022-23541)
                              └── express@4.19.2 (CVE-2024-43796)
                                    ↓
                                 MongoDB
```

### After (Hardened) Architecture

```
Browser → CSP + XCTO + XFO + Referrer-Policy + Permissions-Policy
                                    ↓
                              React SPA (DOMPurify + safe rendering)
                                    ↓
                              Express Backend
                              ├── CORS: explicit origin only
                              ├── Rate limiting (tiered)
                              ├── Input validation (type, length, pattern)
                              ├── Ownership checks + RBAC
                              ├── Generic errors + structured logs
                              ├── jsonwebtoken@9.0.2 + algorithm pinning
                              └── express@4.21.1 (patched)
                                    ↓
                                 MongoDB (Mongoose ODM validation)
```

---

## 🔐 Security Controls — Detailed Breakdown

### 1. Dependency Security (V-01, V-08)

**CVE-2022-23541 — JWT Algorithm Confusion:**
```javascript
// BASELINE: No algorithm restriction
decoded = jwt.verify(token, secret);       // ← VULNERABLE

// HARDENED: Explicit HS256 pinning
decoded = jwt.verify(token, secret, {
  algorithms: ['HS256']                    // ← SECURE
});
```

**CVE-2024-43796 — Express XSS:**
```
BASELINE: express@4.19.2 (vulnerable res.redirect)
HARDENED: express@4.21.1 (URL properly encoded)
```

### 2. HTTP Security Headers (V-02)

| Header | Baseline | Hardened |
|---|---|---|
| Content-Security-Policy | ❌ MISSING | ✅ `default-src 'self'; script-src 'self'` |
| X-Content-Type-Options | ❌ MISSING | ✅ `nosniff` |
| Referrer-Policy | ❌ MISSING | ✅ `strict-origin-when-cross-origin` |
| X-Frame-Options | ❌ MISSING | ✅ `DENY` |
| Permissions-Policy | ❌ MISSING | ✅ `camera=(), microphone=(), geolocation=(), payment=()` |
| X-Powered-By | ⚠️ `Express` (exposed) | ✅ REMOVED |

### 3. Input Validation (V-03)

| Field | Baseline | Hardened |
|---|---|---|
| Password | Any value accepted (even `"1"`) | Min 8 chars, uppercase + lowercase + number + special char |
| Post Title | No limits | 3–200 characters |
| Post Content | No limits | 10–50,000 characters |
| Comment | No limits | 1–5,000 characters |
| Route Params | No format check | MongoDB ObjectId format validated |

### 4. XSS Prevention (V-04)

```jsx
// BASELINE: Raw HTML rendering — XSS executes
<div dangerouslySetInnerHTML={{ __html: post.content }} />

// HARDENED: DOMPurify sanitization — XSS stripped
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />
```

**Defense in Depth:** Server-side DOMPurify sanitization + client-side DOMPurify + CSP `script-src 'self'` (blocks inline scripts even if sanitization is bypassed).

### 5. Rate Limiting (V-05)

| Endpoint | Baseline | Hardened |
|---|---|---|
| `POST /api/auth/login` | ∞ unlimited | 5 requests / 15 min |
| `POST /api/auth/register` | ∞ unlimited | 5 requests / 15 min |
| `POST /api/comments/:id` | ∞ unlimited | 10 requests / 15 min |
| `GET /api/*` | ∞ unlimited | 100 requests / 15 min |
| Exceeded | No response | HTTP 429 + Retry-After header |

### 6. Error Handling (V-06)

```json
// BASELINE: Exposes internal details
{
  "error": "Cast to ObjectId failed for value \"abc\" at path \"_id\"",
  "stack": "CastError: Cast to ObjectId failed...\n    at model.Query...",
  "path": "/api/posts/abc",
  "database_error": { "code": null }
}

// HARDENED: Generic client response + internal logging
{
  "error": "The requested resource was not found.",
  "requestId": "a1b2c3d4-e5f6-..."
}
```

### 7. Authorization — IDOR Prevention (V-07)

```javascript
// BASELINE: Any authenticated user can modify ANY resource
await BlogPost.findByIdAndUpdate(req.params.id, updates);

// HARDENED: Ownership check before modification
if (post.author.toString() !== req.user.id && req.user.role !== 'ADMIN') {
  return res.status(403).json({ error: 'Permission denied.' });
}
```

---

## 🚀 Running the Dual Instances

### Quick Start

```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install
cd ..

# 2. Seed the database with demo data
cd server && npm run seed && cd ..

# 3. Launch both instances simultaneously
./start-dual.sh
```

### Manual Start (Individual Terminals)

```bash
# Terminal 1: Baseline Backend (port 5001)
cd server && npm run dev:baseline

# Terminal 2: Hardened Backend (port 5002)
cd server && npm run dev:hardened

# Terminal 3: Baseline Frontend (port 5173)
cd client && npm run dev:baseline

# Terminal 4: Hardened Frontend (port 5174)
cd client && npm run dev:hardened
```

### Port Map

| Service | Port | URL |
|---|---|---|
| Baseline Backend | 5001 | `http://localhost:5001/api/health` |
| Hardened Backend | 5002 | `http://localhost:5002/api/health` |
| Baseline Frontend | 5173 | `http://localhost:5173` |
| Hardened Frontend | 5174 | `http://localhost:5174` |

### Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@blog.local` | `Admin@123` |
| User | `alice@blog.local` | `Alice@123` |
| User | `bob@blog.local` | `Bobby@123` |

---

## 📊 Demo Scenarios for Presentation

### Demo 1: XSS Attack (V-04)
1. Login as `alice@blog.local` on **both** instances
2. Create a comment with content: `<img src="x" onerror="alert('XSS Demo')">`
3. **Baseline (5173):** Alert box pops up — XSS executes ✅
4. **Hardened (5174):** Tag stripped — text displayed safely ✅

### Demo 2: Broken Authorization (V-07)
1. Login as `alice@blog.local` on both instances
2. Navigate to a post created by a different user (e.g., Admin's post)
3. **Baseline (5173):** Can edit/delete ANY user's post ✅
4. **Hardened (5174):** Gets `403 Forbidden` — ownership enforced ✅

### Demo 3: Rate Limiting (V-05)
1. Send 10 rapid login attempts with wrong password
2. **Baseline (5001):** All 10 requests processed — brute-force possible ✅
3. **Hardened (5002):** After 5th attempt → HTTP 429 "Too many requests" ✅

### Demo 4: Error Disclosure (V-06)
1. Request an invalid endpoint: `GET /api/posts/invalid_id`
2. **Baseline (5001):** Returns stack traces, file paths, DB error codes ✅
3. **Hardened (5002):** Returns generic "Invalid format" with request ID only ✅

### Demo 5: Security Headers (V-02)
1. Open browser DevTools → Network tab
2. **Baseline (5001):** `X-Powered-By: Express` visible, no CSP ✅
3. **Hardened (5002):** CSP, XCTO, XFO headers present, X-Powered-By removed ✅

### Demo 6: Framework Fingerprinting
1. Hit `GET /api/info` on both backends
2. **Baseline (5001):** Exposes runtime, framework, database info ✅
3. **Hardened (5002):** Only application name + security mode shown ✅

### Demo 7: Input Validation (V-03)
1. Try registering with password `"1"` on both instances
2. **Baseline (5173):** Registration succeeds with weak password ✅
3. **Hardened (5174):** Validation error — password requirements not met ✅

### Demo 8: JWT Algorithm Security (V-01 — CVE-2022-23541)
1. Check the auth middleware source code
2. **Baseline:** `jwt.verify(token, secret)` — no algorithm restriction
3. **Hardened:** `jwt.verify(token, secret, { algorithms: ['HS256'] })` — algorithm pinned

---

## 📁 Project File Structure

```
blog-security-audit/
├── .env.baseline            # Env config for vulnerable instance (port 5001)
├── .env.hardened             # Env config for secure instance (port 5002)
├── start-dual.sh             # Launches all 4 processes simultaneously
├── docker-compose.yml        # Docker setup (optional)
│
├── client/                   # React Frontend
│   ├── index.html            # HTML entry with Inter font + meta tags
│   ├── package.json          # Dependencies + dual-mode scripts
│   ├── vite.config.baseline.js  # Port 5173 → Backend 5001
│   ├── vite.config.hardened.js  # Port 5174 → Backend 5002
│   └── src/
│       ├── main.jsx          # Entry point with AuthProvider + BrowserRouter
│       ├── App.jsx           # Routes + layout
│       ├── App.css           # Premium dark theme (808 lines)
│       ├── context/
│       │   └── AuthContext.jsx  # JWT auth state management
│       ├── services/
│       │   └── api.js        # Axios instance with token refresh interceptor
│       ├── components/
│       │   ├── Navbar.jsx    # Security mode badge (baseline/hardened)
│       │   ├── PostCard.jsx  # Post preview cards
│       │   ├── CommentSection.jsx  # XSS demo (baseline vs hardened)
│       │   └── ProtectedRoute.jsx  # Auth + admin route guards
│       └── pages/
│           ├── Home.jsx      # Post listing + search + pagination
│           ├── Post.jsx      # XSS vulnerability demo (V-04)
│           ├── Login.jsx     # Auth with demo credentials
│           ├── Register.jsx  # Password validation demo (V-03)
│           ├── CreatePost.jsx
│           ├── EditPost.jsx
│           ├── Profile.jsx
│           └── Admin.jsx     # Admin dashboard (stats + user management)
│
├── server/                   # Express Backend
│   ├── package.json          # Dual-mode scripts + security dependencies
│   └── src/
│       ├── app.js            # Main entry — middleware pipeline + routes
│       ├── config/
│       │   ├── env.js        # Centralized env config with mode helpers
│       │   └── db.js         # MongoDB connection via Mongoose
│       ├── controllers/
│       │   ├── authController.js    # Register/Login/Logout/Refresh
│       │   ├── postController.js    # CRUD with ownership checks (V-07)
│       │   ├── commentController.js # CRUD with sanitization (V-04)
│       │   └── adminController.js   # Admin operations
│       ├── middleware/
│       │   ├── requestId.js       # UUID request correlation
│       │   ├── securityHeaders.js # Helmet (V-02) — baseline: skip
│       │   ├── rateLimiter.js     # Rate limiting (V-05) — baseline: skip
│       │   ├── validate.js        # Input validation (V-03) — baseline: skip
│       │   ├── auth.js            # JWT verification (V-01/CVE-2022-23541)
│       │   └── errorHandler.js    # Error disclosure (V-06)
│       ├── models/
│       │   ├── User.js         # bcrypt pre-save hook, toJSON sanitization
│       │   ├── BlogPost.js     # Text search index
│       │   ├── Comment.js      # postId + author references
│       │   └── RefreshToken.js # TTL index for auto-expiry
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── postRoutes.js
│       │   ├── commentRoutes.js
│       │   └── adminRoutes.js
│       └── utils/
│           ├── logger.js         # JSON (hardened) vs text (baseline) logging
│           ├── securityLogger.js  # Audit event logging
│           ├── sanitizer.js       # HTML sanitization allowlist
│           └── seed.js            # Demo data seeder
│
├── security/                  # Security Documentation
│   ├── cve-mapping/
│   │   ├── CVE-2022-23541.md  # jsonwebtoken algorithm confusion
│   │   └── CVE-2024-43796.md  # Express XSS in res.redirect()
│   ├── reports/               # Scan results
│   ├── scripts/               # Security testing scripts
│   └── security-decision-log.md
│
└── docs/                      # Project Documentation
    ├── architecture.md        # Before/after architecture diagrams
    ├── before-after.md        # Side-by-side security comparison
    ├── cve-analysis.md        # CVE deep-dive with CVSS breakdowns
    ├── vulnerability-register.md  # All 8 vulnerabilities cataloged
    ├── threat-model.md        # Threat analysis
    ├── security-model.md      # Security model overview
    ├── remediation.md         # Fix documentation
    ├── testing.md             # Security test plan
    ├── fingerprinting.md      # Framework fingerprinting notes
    └── final-security-audit.md
```

---

## 🎯 Key Concepts for Presentation

### 1. Defense in Depth
No single security control is sufficient. The hardened mode implements **layered defenses**:
- **Input validation** rejects bad data at the gate
- **Sanitization** cleans data that passes validation
- **CSP headers** block inline scripts even if sanitization fails
- **Ownership checks** prevent unauthorized access even if auth is bypassed
- **Rate limiting** slows down attackers even if other controls are defeated

### 2. CVE Lifecycle
```
Discovery → NVD Publication → CVSS Scoring → Application Assessment →
Remediation → Verification → Documentation
```

### 3. CVSS ≠ Application Risk
- **CVE-2022-23541** has CVSS 5.0/6.3 (MEDIUM), but application risk is MEDIUM-LOW because we only use symmetric keys
- **CVE-2024-43796** has CVSS 5.0 (MEDIUM), but application risk is LOW because we don't pass user input to `res.redirect()`
- **Context matters more than the raw score**

### 4. Authentication vs Authorization
- **Authentication** answers: "Who are you?" (JWT verification)
- **Authorization** answers: "Are you allowed to do this?" (ownership + role checks)
- The baseline demonstrates that having authentication does NOT automatically provide authorization

### 5. Security Mode Toggle Pattern
The codebase uses a **runtime toggle** (`SECURITY_MODE` env var) that controls security behavior through `env.isBaseline()` / `env.isHardened()` checks. This allows the **same codebase** to demonstrate both vulnerable and secure behavior without maintaining separate codebases.

---

## 📈 Metrics & Evidence

| Metric | Baseline | Hardened |
|---|---|---|
| `npm audit` vulnerabilities | 2 (CVE-2022-23541, CVE-2024-43796) | 0 |
| Security headers present | 0/6 | 6/6 |
| Input validation rules | 0 | 15+ (across register, login, posts, comments) |
| Rate limiters active | 0 | 3 (auth, general, comment) |
| XSS payload executes | Yes | No (stripped + CSP blocked) |
| Error stack traces exposed | Yes | No (generic message + request ID) |
| Ownership checks enforced | No | Yes (403 on unauthorized access) |
| Framework fingerprinting possible | Yes (X-Powered-By, /api/info) | No (headers removed, minimal info) |

---

## 🛠️ Tools & References

| Category | Tool/Resource |
|---|---|
| **CVE Database** | [NVD (NIST)](https://nvd.nist.gov/) |
| **CVSS Calculator** | [FIRST CVSS v3.1 Calculator](https://www.first.org/cvss/calculator/3.1) |
| **Security Standards** | [OWASP Top 10](https://owasp.org/www-project-top-ten/) |
| **Dependency Audit** | `npm audit` |
| **Header Testing** | Browser DevTools → Network → Response Headers |
| **XSS Testing** | `<script>alert("XSS")</script>` payload |
| **API Testing** | curl / Postman / Browser DevTools |

---

*Built for academic demonstration of the web application security audit lifecycle.*
*All vulnerabilities are intentionally introduced and exist only in baseline mode.*
