import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error -- Node test runner resolves .ts at runtime with --experimental-strip-types.
import {
  getStaffIdBackendErrorMessage,
  getStaffIdValidationError,
  isValidStaffId,
  normalizeStaffId,
} from "../lib/staff-id.ts";

test("normalizes staff ID by trimming whitespace", () => {
  assert.equal(normalizeStaffId("  ENG/TEACHER_001  "), "ENG/TEACHER_001");
});

test("accepts valid staff IDs", () => {
  assert.equal(isValidStaffId("ENG/TEACHER_001"), true);
  assert.equal(isValidStaffId("SCI-LECT_02"), true);
  assert.equal(isValidStaffId("AB"), true);
});

test("rejects invalid staff IDs", () => {
  assert.equal(isValidStaffId("A"), false);
  assert.equal(isValidStaffId("invalid staff"), false);
  assert.equal(isValidStaffId("bad*id"), false);
});

test("returns clear validation errors", () => {
  assert.equal(getStaffIdValidationError(""), "Staff ID is required");
  assert.equal(
    getStaffIdValidationError("A"),
    "Staff ID must be at least 2 characters",
  );
  assert.equal(
    getStaffIdValidationError("staff id with space"),
    "Staff ID can only contain letters, numbers, slash (/), underscore (_), and dash (-)",
  );
});

test("maps backend staff-id errors to user-friendly messages", () => {
  assert.equal(
    getStaffIdBackendErrorMessage("Invalid staff ID"),
    "Invalid staff ID. This ID is not in the approved staff directory. Please contact your administrator.",
  );
  assert.equal(
    getStaffIdBackendErrorMessage("Staff ID already linked to an account"),
    "This staff ID is already linked to another account. Contact your administrator if this is unexpected.",
  );
  assert.equal(
    getStaffIdBackendErrorMessage("Staff ID/email mismatch"),
    "The staff ID does not match the email provided. Please use the official email tied to this staff ID.",
  );
});
