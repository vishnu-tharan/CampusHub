import { test } from "node:test";
import assert from "node:assert/strict";
import { clubSchema, eventSchema } from "../src/lib/validation.js";
const good = () => ({
  title: "Test campus event",
  description: "A useful workshop for students to learn together.",
  location: "Campus Lab",
  clubId: "test-club",
  category: "TECHNOLOGY",
  capacity: "20",
  startsAt: new Date(Date.now() + 86400000).toISOString(),
  endsAt: new Date(Date.now() + 90000000).toISOString(),
});
test("valid event parses capacity and dates", () => {
  const value = eventSchema.parse(good());
  assert.equal(value.capacity, 20);
  assert.ok(value.startsAt instanceof Date);
});
test("rejects zero, negative, decimal, and excessive capacity", () => {
  for (const capacity of ["0", "-1", "1.5", "10001", "hello"])
    assert.equal(eventSchema.safeParse({ ...good(), capacity }).success, false);
});
test("rejects past and reversed dates", () => {
  const e = good();
  assert.equal(
    eventSchema.safeParse({ ...e, startsAt: "2020-01-01T12:00:00Z" }).success,
    false,
  );
  assert.equal(
    eventSchema.safeParse({ ...e, endsAt: e.startsAt }).success,
    false,
  );
});
test("rejects missing timezone, bad category, empty and oversized text", () => {
  for (const change of [
    { startsAt: "2030-01-01T12:00" },
    { category: "ADMIN" },
    { title: "  " },
    { description: "x".repeat(5001) },
  ])
    assert.equal(
      eventSchema.safeParse({ ...good(), ...change }).success,
      false,
    );
});
test("club validation trims input and rejects short descriptions", () => {
  assert.equal(
    clubSchema.parse({
      name: "  Computing Club  ",
      description: "Students learning together",
    }).name,
    "Computing Club",
  );
  assert.equal(
    clubSchema.safeParse({ name: "Club", description: "tiny" }).success,
    false,
  );
});
