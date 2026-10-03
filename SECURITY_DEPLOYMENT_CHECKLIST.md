# Security & Portal Isolation Deployment Guide: Sri Lakshmi Durga Agencies

This document details the architectural separation, session isolation, reverse proxy defense-in-depth, and step-by-step verification checklist to ensure zero cross-portal leakage between the **Customer Portal** and **Administrator Portal**.

---

## 1. Architectural & Cryptographic Separation Overview

| Layer | Customer Portal (`app.<domain>.com`) | Administrator Portal (`admin.<domain>.com`) |
| :--- | :--- | :--- |
| **Physical Bundle** | `frontend/dist/customer/` (zero admin components) | `frontend/dist/admin/` (dedicated operations console) |
| **HTML Entry** | `index.html` -> `mainCustomer.jsx` | `admin.html` -> `mainAdmin.jsx` |
| **Cookie Name** | `slda_customer_session` | `slda_admin_session` |
| **Cookie Host Scope**| Host-only (omits wildcard `.domain.com`) | Host-only (omits wildcard `.domain.com`) |
| **Cookie Flags** | `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/` | `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/` |
| **JWT Audience (`aud`)** | `customer-portal` | `admin-portal` |
| **JWT Signing Key** | `JWT_CUSTOMER_SECRET` | `JWT_ADMIN_SECRET` (distinct key) |
| **Token Lifetime** | 7 Days | 12 Hours (strict rotation) |
| **API Namespace** | `/api/v1/customer/*` | `/api/v1/admin/*` |
| **Reverse Proxy Edge**| Hard-blocks any `/api/v1/admin/*` or `/admin/*` | Restricts access and proxies `/api/v1/admin/*` |

---

## 2. Step-by-Step Penetration & Isolation Verification Checklist

Execute these verification tests before cutting over production DNS:

### Test 1: Cross-Token Injection (Customer Token on Admin Endpoint)
- **Objective**: Ensure a customer bearer token or session cookie cannot execute administrative commands.
- **Curl Command**:
  ```bash
  curl -i -X GET https://admin.srilakshmidurgaagencies.com/api/v1/admin/orders \
    -H "Authorization: Bearer <CUSTOMER_JWT_TOKEN>"
  ```
- **Expected Result**: **`HTTP/1.1 403 Forbidden`**
  ```json
  {
    "success": false,
    "message": "Access Denied: Customer tokens cannot be used to access the Administrator Portal.",
    "code": "PORTAL_ISOLATION_VIOLATION"
  }
  ```

### Test 2: Token Audience & Secret Cross-Verification
- **Objective**: Verify admin token verifier rejects customer tokens at the cryptographic level.
- **Verification**:
  - Run the automated security suite:
    ```bash
    cd backend
    npm run test:security
    ```
  - Verifies that `verifyAdminToken(customerToken)` throws a JsonWebToken error due to secret and audience mismatch (`aud !== "admin-portal"`).

### Test 3: Cross-Origin Request Penetration (CORS Edge & Origin Guard)
- **Objective**: Prevent customer frontend JavaScript or browser contexts from executing cross-origin requests to admin endpoints.
- **Curl Command**:
  ```bash
  curl -i -X GET https://admin.srilakshmidurgaagencies.com/api/v1/admin/products \
    -H "Origin: https://app.srilakshmidurgaagencies.com"
  ```
- **Expected Result**: **`HTTP/1.1 403 Forbidden`**
  ```json
  {
    "success": false,
    "message": "Cross-Origin Access Denied: Customer origin cannot access Administrator endpoints.",
    "code": "CROSS_ORIGIN_ADMIN_BLOCKED"
  }
  ```

### Test 4: Reverse Proxy Edge Blocking (Nginx / Caddy)
- **Objective**: Verify that admin API endpoints cannot be reached through the customer subdomain.
- **Curl Command**:
  ```bash
  curl -i -X GET https://app.srilakshmidurgaagencies.com/api/v1/admin/orders
  ```
- **Expected Result**: **`HTTP/1.1 404 Not Found`** returned directly by Nginx/Caddy edge, without hitting the Node.js backend.

### Test 5: Live Database Administrative Role Verification
- **Objective**: Ensure revoked administrators or tampered tokens are rejected immediately even if the token has not expired.
- **Verification**:
  - Backend `requireAdminAuth` queries Supabase PostgreSQL `users` table:
    ```sql
    SELECT id, name, email, role FROM users WHERE id = $1;
    ```
  - If `role !== 'admin'`, request is rejected with `403 Forbidden` (`INSUFFICIENT_PRIVILEGES`).

### Test 6: Zero-Bleed Frontend Bundle Verification
- **Objective**: Guarantee that customer builds contain zero administrative source code, forms, or logic.
- **Build & Verification Command**:
  ```bash
  cd frontend
  npm run build
  
  # Search customer bundle for admin components
  grep -rn "AdminDashboard" dist/customer/
  grep -rn "AdminOrders" dist/customer/
  grep -rn "AdminCoupons" dist/customer/
  ```
- **Expected Result**: Zero matches found in `dist/customer/`.

### Test 7: Host-Isolated Cookie Attributes
- **Objective**: Verify authentication cookies are never shared across subdomains.
- **Inspect Response Headers**:
  ```http
  Set-Cookie: slda_admin_session=<TOKEN>; Max-Age=43200; Path=/; HttpOnly; Secure; SameSite=Strict
  ```
- **Criteria**:
  - `Domain` attribute is **omitted** (browser treats as Host-Only cookie).
  - Wildcard domain (e.g. `Domain=.srilakshmidurgaagencies.com`) is strictly prohibited.
  - `HttpOnly` and `SameSite=Strict` are present.

---

## 3. Automated Security Test Runner

Run the full isolation test suite anytime changes are made to authentication, middleware, or routes:

```bash
cd backend
npm run test:security
```

Sample Passing Output:
```
==================================================================
🔒 STARTING SECURITY & ISOLATION VERIFICATION SUITE
==================================================================
[1] Token Signing Secret & Audience Isolation
  ✅ PASS: Customer token valid with customer secret and audience 'customer-portal'
  ✅ PASS: Admin verifier cryptographically REJECTS Customer token (Secret/Audience mismatch)
  ✅ PASS: Customer verifier cryptographically REJECTS Admin token (Secret/Audience mismatch)

[2] Route Penetration — Cross-Portal Rejection
  ✅ PASS: Admin API returns 403 Forbidden when presented with Customer token
  ✅ PASS: Response explicitly cites portal isolation violation or audience mismatch

[3] Admin Endpoint Unauthenticated Access Control
  ✅ PASS: Admin API returns 401 Unauthorized for requests with no credentials

[4] Cross-Origin Origin Header Guarding
  ✅ PASS: Admin API rejects requests originating from Customer Portal domain with 403 Forbidden
  ✅ PASS: Response code confirms CROSS_ORIGIN_ADMIN_BLOCKED

[5] Database-Backed Administrative Role Verification
  ✅ PASS: Admin API checks live database and rejects token if user is not in database with 'admin' role

[6] Cookie Host Isolation Attributes
  ✅ PASS: Customer cookie enforces HttpOnly and SameSite=Strict
  ✅ PASS: Customer cookie omits wildcard domain (strictly host-bound to app.<domain>.com)
  ✅ PASS: Admin cookie enforces HttpOnly and SameSite=Strict
  ✅ PASS: Admin cookie omits wildcard domain (strictly host-bound to admin.<domain>.com)

==================================================================
TEST RESULTS: 13 PASSED, 0 FAILED
==================================================================
```

---

## 4. Production Secret Rotation Sequence

Before opening the site to production traffic, rotate secrets:

1. **Generate Cryptographically Random Secrets**:
   ```bash
   node -e "console.log('JWT_CUSTOMER_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
   node -e "console.log('JWT_ADMIN_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
   ```
2. **Set Environment Variables on Hosting Provider (Render / VPS)**:
   - `JWT_CUSTOMER_SECRET`
   - `JWT_ADMIN_SECRET`
   - `CUSTOMER_PORTAL_URL=https://app.srilakshmidurgaagencies.com`
   - `ADMIN_PORTAL_URL=https://admin.srilakshmidurgaagencies.com`
3. **Deploy Reverse Proxy (Nginx or Caddy)**:
   - Copy `nginx/nginx.conf` to `/etc/nginx/nginx.conf` (or use `deploy/Caddyfile`).
   - Run `nginx -t && systemctl reload nginx`.
