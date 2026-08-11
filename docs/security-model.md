# Security Model

## Authentication Model

**Mechanism:** Dual-Token Architecture (Short-lived JWT Access Token + Long-lived JWT Refresh Token).

- Users provide email + password at login
- Server verifies credentials against bcrypt-hashed password
- Server issues two tokens:
  1. **Access Token:** A short-lived JWT (e.g., 15m) returned in the JSON payload, used for API requests via `Authorization: Bearer <token>`.
  2. **Refresh Token:** A long-lived JWT (e.g., 7d) stored in the database and set as an `HttpOnly`, `Strict` cookie.
- When the Access Token expires, the client calls `/api/auth/refresh` where the server reads the `HttpOnly` cookie, verifies the refresh token against the database (ensuring it's not revoked), and issues a new Access Token.

**Why this approach?**
- Storing access tokens in localStorage exposes them to XSS attacks, but their short lifespan (15m) mitigates the risk window.
- The refresh token is hidden from JavaScript (`HttpOnly`), preventing XSS theft. 
- Tracking refresh tokens in the database allows for immediate revocation (e.g., during logout or suspicious activity) without needing stateful access tokens.

**Authentication ≠ Authorization:**
- Authentication: "Who are you?" (identity verification)
- Authorization: "Are you allowed to do this?" (permission checking)

## Authorization Model

### Role-Based Access Control (RBAC)

| Role | Permissions |
|---|---|
| `USER` | Create/read posts, create/read/delete own comments, edit/delete own posts |
| `ADMIN` | All USER permissions + manage all users, delete any post/comment |

### Resource Ownership

In addition to roles, the system checks resource ownership:
- Post update/delete: Must be the author OR an ADMIN
- Comment delete: Must be the author OR an ADMIN

## Input Validation Model

Three distinct concepts:

| Concept | Purpose | Example |
|---|---|---|
| **Validation** | Reject malformed input | "Is this a valid email format?" |
| **Sanitization** | Clean input to remove dangerous parts | "Strip `<script>` tags from HTML" |
| **Encoding** | Make output safe for rendering context | "Convert `<` to `&lt;` in HTML output" |

All three are needed. Validation alone does NOT prevent XSS.

## Output Encoding Model

- **Blog posts (baseline):** Rendered as raw HTML via `dangerouslySetInnerHTML` — UNSAFE
- **Blog posts (hardened):** Rendered as text (React default escaping) — SAFE
- **Comments (baseline):** Rendered as raw HTML — UNSAFE
- **Comments (hardened):** Rendered as text — SAFE
- **API responses:** JSON serialized (inherently safe for API consumers)
