# Security Testing

## Test Suite

The automated security test suite (`security/scripts/run-security-tests.js`) covers:

### Authentication Tests
| Test | Expected (Baseline) | Expected (Hardened) |
|---|---|---|
| Invalid login | 401 | 401 |
| Missing token | 401 | 401 |
| Invalid token | 401 | 401 |
| Valid registration | 201 | 201 |

### Authorization Tests
| Test | Expected (Baseline) | Expected (Hardened) |
|---|---|---|
| Non-admin accessing admin routes | 403 | 403 |
| User creating own post | 201 | 201 |
| User updating other's post | 200 (vulnerability!) | 403 |

### Input Validation Tests
| Test | Expected (Baseline) | Expected (Hardened) |
|---|---|---|
| Missing required fields | 400 | 400 |
| Oversized input | 201 (accepts!) | 400 |

### XSS Tests
| Test | Expected (Baseline) | Expected (Hardened) |
|---|---|---|
| XSS payload in comment | Stored as-is | Sanitized/rejected |

### Rate Limiting Tests
| Test | Expected (Baseline) | Expected (Hardened) |
|---|---|---|
| 10 rapid auth attempts | All succeed | 429 after 5th |

### Security Header Tests
| Test | Expected (Baseline) | Expected (Hardened) |
|---|---|---|
| CSP present | ❌ | ✅ |
| X-Content-Type-Options | ❌ | ✅ |
| Referrer-Policy | ❌ | ✅ |
| X-Powered-By | Express | Removed |

### Error Handling Tests
| Test | Expected (Baseline) | Expected (Hardened) |
|---|---|---|
| Stack trace in error response | Present | Absent |

## Running Tests

```bash
# Baseline mode
SECURITY_MODE=baseline node server/src/app.js &
node security/scripts/run-security-tests.js --mode baseline

# Hardened mode
SECURITY_MODE=hardened node server/src/app.js &
node security/scripts/run-security-tests.js --mode hardened
```

## Scanning Tools

| Script | Purpose |
|---|---|
| `security/scripts/run-security-tests.js` | Full security test suite |
| `security/scripts/fingerprint-scan.js` | Technology fingerprinting |
| `security/scripts/header-scan.js` | HTTP security header analysis |
| `security/scripts/dependency-scan.js` | Dependency inventory & CVE check |
| `security/scripts/run-before-after.sh` | Runs all scans in sequence |
