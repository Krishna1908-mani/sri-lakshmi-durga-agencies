/**
 * Automated test script to verify all validation rules required by specification:
 * - Name: letters and spaces only
 * - Email: valid structure username@domain.extension
 * - Strong password: 8+ chars, upper, lower, number, special character
 * - Confirm password match
 */

const assert = require("assert");

// Validation patterns matching both frontend and backend
const nameRegex = /^[A-Za-z ]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

console.log("=== RUNNING REGISTRATION VALIDATION SUITE ===");

// 1. Name validation tests
function testName(val) {
  const trimmed = typeof val === "string" ? val.trim() : "";
  return Boolean(trimmed && nameRegex.test(trimmed));
}

assert.strictEqual(testName("Krishna123"), false, "Krishna123 must be rejected");
assert.strictEqual(testName("12345"), false, "12345 must be rejected");
assert.strictEqual(testName("Krishna@"), false, "Krishna@ must be rejected");
assert.strictEqual(testName("Krishna_Teja"), false, "Krishna_Teja must be rejected");
assert.strictEqual(testName("Krishna#Teja"), false, "Krishna#Teja must be rejected");
assert.strictEqual(testName("   "), false, "Empty spaces must be rejected");
assert.strictEqual(testName(""), false, "Empty string must be rejected");

assert.strictEqual(testName("Krishna"), true, "Krishna must be accepted");
assert.strictEqual(testName("Krishna Teja"), true, "Krishna Teja must be accepted");
assert.strictEqual(testName("Pothuri Krishna Mani Teja"), true, "Pothuri Krishna Mani Teja must be accepted");
assert.strictEqual(testName("  Krishna Teja  "), true, "Trimmed valid name must be accepted");
console.log("✓ All Name validation tests passed!");

// 2. Email validation tests
function testEmail(val) {
  const trimmed = typeof val === "string" ? val.trim().toLowerCase() : "";
  return Boolean(trimmed && emailRegex.test(trimmed));
}

assert.strictEqual(testEmail("krishna"), false, "krishna without @ must be rejected");
assert.strictEqual(testEmail("krishna@"), false, "krishna@ must be rejected");
assert.strictEqual(testEmail("@gmail.com"), false, "@gmail.com must be rejected");
assert.strictEqual(testEmail("krishna@gmail"), false, "krishna@gmail without domain extension must be rejected");
assert.strictEqual(testEmail("krishna gmail.com"), false, "krishna gmail.com must be rejected");

assert.strictEqual(testEmail("krishna@gmail.com"), true, "krishna@gmail.com must be accepted");
assert.strictEqual(testEmail("user123@yahoo.com"), true, "user123@yahoo.com must be accepted");
assert.strictEqual(testEmail("customer@company.in"), true, "customer@company.in must be accepted");
assert.strictEqual(testEmail("  Krishna@Gmail.COM  "), true, "Trimmed/lowercased email must be accepted");
console.log("✓ All Email validation tests passed!");

// 3. Password validation tests
function testPassword(val) {
  return typeof val === "string" && passwordRegex.test(val);
}

assert.strictEqual(testPassword("krishna123"), false, "krishna123 (no upper, no special) must be rejected");
assert.strictEqual(testPassword("KRISHNA123"), false, "KRISHNA123 (no lower, no special) must be rejected");
assert.strictEqual(testPassword("Krishna123"), false, "Krishna123 (no special char) must be rejected");
assert.strictEqual(testPassword("Krishna@"), false, "Krishna@ (no number, under 8 chars) must be rejected");
assert.strictEqual(testPassword("12345678"), false, "12345678 (no letters, no special) must be rejected");
assert.strictEqual(testPassword("Kr@1"), false, "Kr@1 (under 8 characters) must be rejected");

assert.strictEqual(testPassword("Krishna@123"), true, "Krishna@123 must be accepted");
assert.strictEqual(testPassword("P@ssword1"), true, "P@ssword1 must be accepted");
assert.strictEqual(testPassword("SriDurga#2026"), true, "SriDurga#2026 must be accepted");
console.log("✓ All Strong Password validation tests passed!");

// 4. Confirm password match test
function testConfirmPassword(password, confirmPassword) {
  return password === confirmPassword;
}

assert.strictEqual(testConfirmPassword("Krishna@123", "Krishna@123"), true, "Matching passwords must pass");
assert.strictEqual(testConfirmPassword("Krishna@123", "Krishna@124"), false, "Mismatched passwords must fail");
console.log("✓ All Confirm Password match tests passed!");

console.log("\nALL SPECIFIED REGISTRATION VALIDATION CRITERIA VERIFIED 100% SUCCESFUL!");
