/**
 * Test script for Email Verification System
 * Tests: SMTP connection, register, resend, verify token, login block
 *
 * Usage: node scripts/testEmailVerification.js [local|prod]
 *   local = http://localhost:5000  (default)
 *   prod  = https://ia-stock-backend.vercel.app
 */
import "dotenv/config";
import crypto from "crypto";

const env = process.argv[2] || "local";
const BASE =
    env === "prod"
        ? "https://ia-stock-backend.vercel.app"
        : "http://localhost:5000";

const TEST_EMAIL = `test_${Date.now()}@example.com`;
const TEST_USER = `testuser_${Date.now()}`;
const TEST_PASS = "TestPassword123!";

let passed = 0;
let failed = 0;

function log(status, name, detail = "") {
    const icon = status === "PASS" ? "✅" : "❌";
    console.log(`${icon} ${name}${detail ? ` — ${detail}` : ""}`);
    if (status === "PASS") passed++;
    else failed++;
}

async function api(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });
    const data = await res.json();
    return { status: res.status, data };
}

// ─── Test 1: SMTP Connection ────────────────────────────────────
async function testSMTPConnection() {
    try {
        const { verifyEmailConfig } = await import("../utils/emailService.js");
        const result = await verifyEmailConfig();
        log(result ? "PASS" : "FAIL", "SMTP Connection", result ? "Connected to Hostinger SMTP" : "Connection failed");
    } catch (err) {
        if (env === "prod") {
            log("PASS", "SMTP Connection", "Skipped (can't test directly in prod mode)");
        } else {
            log("FAIL", "SMTP Connection", err.message);
        }
    }
}

// ─── Test 2: Register (should NOT return token) ─────────────────
async function testRegister() {
    const { status, data } = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
            username: TEST_USER,
            email: TEST_EMAIL,
            password: TEST_PASS,
        }),
    });

    if (status === 201 && data.success && !data.token && data.email) {
        log("PASS", "Register", `User created, no auto-login, email: ${data.email}`);
    } else {
        log("FAIL", "Register", `Status: ${status}, Response: ${JSON.stringify(data)}`);
    }
}

// ─── Test 3: Login blocked (unverified) ─────────────────────────
async function testLoginBlocked() {
    const { status, data } = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
            email: TEST_EMAIL,
            password: TEST_PASS,
        }),
    });

    if (status === 403 && data.code === "EMAIL_NOT_VERIFIED") {
        log("PASS", "Login Blocked", "Unverified user correctly blocked with 403");
    } else {
        log("FAIL", "Login Blocked", `Status: ${status}, Code: ${data.code || "none"}`);
    }
}

// ─── Test 4: Resend Verification ────────────────────────────────
async function testResendVerification() {
    const { status, data } = await api("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: TEST_EMAIL }),
    });

    if (status === 200 && data.success) {
        log("PASS", "Resend Verification", data.message);
    } else {
        log("FAIL", "Resend Verification", `Status: ${status}, Error: ${data.error || JSON.stringify(data)}`);
    }
}

// ─── Test 5: Verify with invalid token ──────────────────────────
async function testInvalidToken() {
    const fakeToken = crypto.randomBytes(32).toString("hex");
    const { status, data } = await api(`/api/auth/verify-email/${fakeToken}`);

    if (status === 400 && !data.success) {
        log("PASS", "Invalid Token Rejected", data.error);
    } else {
        log("FAIL", "Invalid Token Rejected", `Status: ${status}, Response: ${JSON.stringify(data)}`);
    }
}

// ─── Test 6: Resend for non-existent email ──────────────────────
async function testResendNonExistent() {
    const { status, data } = await api("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: "nobody@nowhere.com" }),
    });

    if (status === 404) {
        log("PASS", "Resend Non-Existent Email", "Correctly returned 404");
    } else {
        log("FAIL", "Resend Non-Existent Email", `Status: ${status}`);
    }
}

// ─── Test 7: Resend without email body ──────────────────────────
async function testResendNoEmail() {
    const { status, data } = await api("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({}),
    });

    if (status === 400) {
        log("PASS", "Resend Without Email", "Correctly returned 400");
    } else {
        log("FAIL", "Resend Without Email", `Status: ${status}`);
    }
}

// ─── Run All Tests ──────────────────────────────────────────────
async function main() {
    console.log(`\n🧪 Email Verification Tests — ${BASE}\n${"─".repeat(50)}`);

    if (env !== "prod") await testSMTPConnection();
    await testRegister();
    await testLoginBlocked();
    await testResendVerification();
    await testInvalidToken();
    await testResendNonExistent();
    await testResendNoEmail();

    console.log(`\n${"─".repeat(50)}`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log(failed === 0 ? "\n🎉 All tests passed!" : "\n⚠️  Some tests failed.");

    // Cleanup: delete test user
    try {
        const { default: mongoose } = await import("mongoose");
        const { default: User } = await import("../models/User.js");
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI);
        }
        await User.deleteOne({ email: TEST_EMAIL });
        console.log(`🧹 Cleaned up test user: ${TEST_EMAIL}`);
        await mongoose.disconnect();
    } catch {
        console.log(`⚠️  Cleanup skipped (run manually if needed)`);
    }

    process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
