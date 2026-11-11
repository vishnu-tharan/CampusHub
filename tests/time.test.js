import { test } from "node:test";
import assert from "node:assert/strict";
import { toUtcTimestamp } from "../src/lib/time.js";
test("campus time is converted independently of the browser timezone", () => {
  assert.equal(
    toUtcTimestamp("2030-06-01T14:00", "Asia/Colombo"),
    "2030-06-01T08:30:00.000Z",
  );
  assert.equal(
    toUtcTimestamp("2030-06-01T14:00", "UTC"),
    "2030-06-01T14:00:00.000Z",
  );
});
test("invalid and nonexistent local times are rejected", () => {
  assert.throws(() => toUtcTimestamp("not-a-date", "Asia/Colombo"), /valid/);
  assert.throws(
    () => toUtcTimestamp("2030-03-10T02:30", "America/New_York"),
    /does not exist/,
  );
});
