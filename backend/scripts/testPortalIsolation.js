/**
 * ==============================================================================
 * SRI LAKSHMI DURGA AGENCIES — AUTOMATED SECURITY & ISOLATION VERIFICATION SUITE
 * ==============================================================================
 * Tests and verifies complete separation between Customer and Admin portals:
 * 1. Cryptographic & Audience isolation between Customer & Admin tokens.
 * 2. Cross-portal token rejection (Customer token on Admin API -> 403 Forbidden).
 * 3. Cross-origin request rejection (Customer origin -> Admin API -> 403 Forbidden).
 * 4. Database-backed administrative role enforcement.
 * 5. Host-isolated cookie configurations (no wildcard domain).
 * ==============================================================================
 */

const http = require("http");
const app = require("../server");
const tokenService = require("../utils/tokenService");
const supabase = require("../config/supabase");

let server;
let baseUrl;

function runHttp(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqOptions = {
      method: options.method || "GET",
      headers: options.headers || {},
    };

    const req = http.request(url, reqOptions, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          parsed = body;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on("error", reject);

    if (options.body) {
      if (typeof options.body === "object") {
        req.setHeader("Content-Type", "application/json");
        req.write(JSON.stringify(options.body));
      } else {
        req.write(options.body);
      }
    }

    req.end();
  });
}

async function runSecuritySuite() {
  console.log("==================================================================");
  console.log("🔒 STARTING SECURITY & ISOLATION VERIFICATION SUITE");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, failureDetails = "") {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      if (failureDetails) console.error(`     Reason: ${failureDetails}`);
      failed++;
    }
  }

  // Start ephemeral server
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[Test Runner] Temporary isolated test server online at ${baseUrl}\n`);
      resolve();
    });
  });

  try {
    // --------------------------------------------------------------------------
    // TEST 1: Cryptographic & Audience Token Verification
    // --------------------------------------------------------------------------
    console.log("[1] Token Signing Secret & Audience Isolation");
    const mockCustomer = { id: 99991, email: "cust.test@slda.com", name: "Test Customer" };
    const mockAdmin = { id: 99992, email: "admin.test@slda.com", name: "Test Admin" };

    const customerToken = tokenService.generateCustomerToken(mockCustomer);
    const adminToken = tokenService.generateAdminToken(mockAdmin);

    // Verify Customer token validates with Customer verifier
    const decodedCust = tokenService.verifyCustomerToken(customerToken);
    assert(
      decodedCust && decodedCust.aud === tokenService.CUSTOMER_AUDIENCE,
      "Customer token valid with customer secret and audience 'customer-portal'"
    );

    // Cross-check: Customer token verified by Admin verifier must throw
    let custOnAdminThrew = false;
    try {
      tokenService.verifyAdminToken(customerToken);
    } catch (e) {
      custOnAdminThrew = true;
    }
    assert(
      custOnAdminThrew,
      "Admin verifier cryptographically REJECTS Customer token (Secret/Audience mismatch)"
    );

    // Cross-check: Admin token verified by Customer verifier must throw
    let adminOnCustThrew = false;
    try {
      tokenService.verifyCustomerToken(adminToken);
    } catch (e) {
      adminOnCustThrew = true;
    }
    assert(
      adminOnCustThrew,
      "Customer verifier cryptographically REJECTS Admin token (Secret/Audience mismatch)"
    );

    // --------------------------------------------------------------------------
    // TEST 2: Route Penetration — Customer Token on Admin Protected Endpoints
    // --------------------------------------------------------------------------
    console.log("\n[2] Route Penetration — Cross-Portal Rejection");

    const penetrateRes = await runHttp("/api/v1/admin/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${customerToken}`,
      },
    });

    assert(
      penetrateRes.status === 403,
      "Admin API returns 403 Forbidden when presented with Customer token",
      `Received HTTP ${penetrateRes.status} instead of 403`
    );

    assert(
      penetrateRes.data && (penetrateRes.data.code === "PORTAL_ISOLATION_VIOLATION" || penetrateRes.data.code === "AUDIENCE_MISMATCH" || penetrateRes.data.message.includes("Customer")),
      "Response explicitly cites portal isolation violation or audience mismatch"
    );

    // --------------------------------------------------------------------------
    // TEST 3: Unauthenticated Access to Admin API
    // --------------------------------------------------------------------------
    console.log("\n[3] Admin Endpoint Unauthenticated Access Control");

    const noAuthRes = await runHttp("/api/v1/admin/orders", {
      method: "GET",
    });

    assert(
      noAuthRes.status === 401,
      "Admin API returns 401 Unauthorized for requests with no credentials",
      `Received HTTP ${noAuthRes.status} instead of 401`
    );

    // --------------------------------------------------------------------------
    // TEST 4: Cross-Origin Request Blocking (Customer Origin -> Admin API)
    // --------------------------------------------------------------------------
    console.log("\n[4] Cross-Origin Origin Header Guarding");

    const corsBlockedRes = await runHttp("/api/v1/admin/products", {
      method: "GET",
      headers: {
        Origin: "https://app.srilakshmidurgaagencies.com",
      },
    });

    assert(
      corsBlockedRes.status === 403,
      "Admin API rejects requests originating from Customer Portal domain with 403 Forbidden",
      `Received HTTP ${corsBlockedRes.status} instead of 403`
    );

    assert(
      corsBlockedRes.data && corsBlockedRes.data.code === "CROSS_ORIGIN_ADMIN_BLOCKED",
      "Response code confirms CROSS_ORIGIN_ADMIN_BLOCKED"
    );

    // --------------------------------------------------------------------------
    // TEST 5: Live Database Role Verification (Revoked / Non-Admin User)
    // --------------------------------------------------------------------------
    console.log("\n[5] Database-Backed Administrative Role Verification");

    // Fetch an actual customer from DB or test with mock ID 999999
    const fakeAdminToken = tokenService.generateAdminToken({
      id: 999999999, // User does not exist or has customer role
      email: "intruder@domain.com",
      name: "Intruder",
    });

    const forgedRes = await runHttp("/api/v1/admin/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${fakeAdminToken}`,
      },
    });

    assert(
      forgedRes.status === 403,
      "Admin API checks live database and rejects token if user is not in database with 'admin' role",
      `Received HTTP ${forgedRes.status} instead of 403`
    );

    // --------------------------------------------------------------------------
    // TEST 6: Cookie Host Isolation (No Wildcard Domain)
    // --------------------------------------------------------------------------
    console.log("\n[6] Cookie Host Isolation Attributes");

    // Mock Express Response object to inspect setCustomerCookie and setAdminCookie
    let customerCookieOpts = null;
    let adminCookieOpts = null;

    const mockRes = {
      cookie: (name, val, opts) => {
        if (name === tokenService.CUSTOMER_COOKIE_NAME) customerCookieOpts = opts;
        if (name === tokenService.ADMIN_COOKIE_NAME) adminCookieOpts = opts;
      },
      clearCookie: () => {},
    };

    tokenService.setCustomerCookie(mockRes, "mock_token");
    tokenService.setAdminCookie(mockRes, "mock_token");

    assert(
      customerCookieOpts && customerCookieOpts.httpOnly === true && customerCookieOpts.sameSite === "strict",
      "Customer cookie enforces HttpOnly and SameSite=Strict"
    );

    assert(
      customerCookieOpts && !customerCookieOpts.domain,
      "Customer cookie omits wildcard domain (strictly host-bound to app.<domain>.com)"
    );

    assert(
      adminCookieOpts && adminCookieOpts.httpOnly === true && adminCookieOpts.sameSite === "strict",
      "Admin cookie enforces HttpOnly and SameSite=Strict"
    );

    assert(
      adminCookieOpts && !adminCookieOpts.domain,
      "Admin cookie omits wildcard domain (strictly host-bound to admin.<domain>.com)"
    );

    // --------------------------------------------------------------------------
    // SUMMARY
    // --------------------------------------------------------------------------
    console.log("\n==================================================================");
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================================");

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error("Test suite runtime failure:", err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
  }
}

runSecuritySuite();
