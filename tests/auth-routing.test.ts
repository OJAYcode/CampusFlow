import test from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error -- Node test runner resolves .ts at runtime with --experimental-strip-types.
import { getLogoutRedirect, getRouteGuardRedirect } from "../src/utils/auth-routing.ts";

test("route guard redirects unauthenticated users to the correct role login", () => {
  assert.equal(
    getRouteGuardRedirect({
      requiredRole: "lecturer",
      isAuthenticated: false,
      isBootstrapping: false,
      userRole: null,
    }),
    "/login/lecturer",
  );
});

test("route guard redirects wrong-role access to unauthorized", () => {
  assert.equal(
    getRouteGuardRedirect({
      requiredRole: "admin",
      isAuthenticated: true,
      isBootstrapping: false,
      userRole: "student",
    }),
    "/unauthorized",
  );
});

test("route guard allows valid role access", () => {
  assert.equal(
    getRouteGuardRedirect({
      requiredRole: "student",
      isAuthenticated: true,
      isBootstrapping: false,
      userRole: "student",
    }),
    null,
  );
});

test("logout redirect falls back to student login when role is unknown", () => {
  assert.equal(getLogoutRedirect(null), "/login/student");
});

test("logout redirect uses role-specific login route", () => {
  assert.equal(getLogoutRedirect("admin"), "/login/admin");
});
