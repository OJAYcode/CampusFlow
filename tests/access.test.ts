import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error -- Node test runner resolves .ts at runtime with --experimental-strip-types.
import { canAccessRole } from "../src/utils/access.ts";

test("student can access student area only", () => {
  assert.equal(canAccessRole("student", "student"), true);
  assert.equal(canAccessRole("lecturer", "student"), false);
});

test("super admin can access admin area", () => {
  assert.equal(canAccessRole("admin", "super_admin"), true);
});
