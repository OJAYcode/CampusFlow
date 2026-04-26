import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error -- Node test runner resolves .ts at runtime with --experimental-strip-types.
import { formatDuration, getRemainingSeconds } from "../src/utils/assessment.ts";

test("formats seconds as mm:ss", () => {
  assert.equal(formatDuration(0), "00:00");
  assert.equal(formatDuration(65), "01:05");
});

test("remaining seconds never drops below zero", () => {
  const past = new Date(Date.now() - 5_000);
  assert.equal(getRemainingSeconds(past), 0);
});
