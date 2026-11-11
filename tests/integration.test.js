import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db, client } from "../src/lib/db.js";
import { createTestUser, cleanupTestData } from "./mongo-fixtures.js";
import { auth } from "../src/lib/auth.js";
import {
  createClub,
  createEvent,
  registerForEvent,
  cancelRegistration,
} from "../src/lib/events.js";
const prefix = "test-" + randomUUID();
const testIp =
  "2001:db8:" +
  randomUUID().slice(0, 4) +
  ":" +
  randomUUID().slice(0, 4) +
  "::1";
const url = process.env.BETTER_AUTH_URL ?? "http://localhost:3001";
function request(path, body, cookie, origin = url) {
  return auth.handler(
    new Request(url + "/api/auth" + path, {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        origin,
        "x-forwarded-for": testIp,
        ...(cookie ? { cookie } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
  );
}
test("MongoDB and authentication integration", async (t) => {
  const organizer = await createTestUser({
    id: prefix + "-org",
    name: "Test Organizer",
    email: prefix + "-org@campushub.test",
    role: "ORGANIZER",
  });
  const other = await createTestUser({
    id: prefix + "-other",
    name: "Other Organizer",
    email: prefix + "-other@campushub.test",
    role: "ORGANIZER",
  });
  const students = await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      createTestUser({
        id: prefix + "-student-" + i,
        name: "Student " + i,
        email: prefix + "-" + i + "@campushub.test",
      }),
    ),
  );
  const email = prefix + "-auth@campushub.test";
  try {
    const club = await createClub(organizer, {
      name: prefix,
      description: "A test club for useful database checks.",
    });
    const input = {
      title: "Test campus workshop",
      description: "This workshop exercises actual registration behavior.",
      location: "Campus Lab",
      clubId: club.id,
      capacity: 3,
      category: "TECHNOLOGY",
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      endsAt: new Date(Date.now() + 90000000).toISOString(),
    };
    const event = await createEvent(organizer, input);
    await t.test("students cannot create clubs or events", async () => {
      await assert.rejects(
        createClub(students[0], {
          name: "Bad club",
          description: "This must never be created.",
        }),
        /Organizer access/,
      );
      await assert.rejects(createEvent(students[0], input), /Organizer access/);
    });
    await t.test(
      "organizers cannot publish to another organizer's club",
      async () => {
        await assert.rejects(createEvent(other, input), /own clubs/);
      },
    );
    await t.test("concurrent requests cannot oversell capacity", async () => {
      const results = await Promise.allSettled(
        students.map((student) => registerForEvent(student, event.id)),
      );
      assert.equal(results.filter((r) => r.status === "fulfilled").length, 3);
      assert.equal(
        await db
          .collection("registrations")
          .countDocuments({ eventId: event.id }),
        3,
      );
    });
    const reservation = await db
      .collection("registrations")
      .findOne({ eventId: event.id });
    assert.ok(reservation);
    const reservedStudent = students.find((s) => s.id === reservation.userId);
    await t.test(
      "duplicates and organizer registration are rejected",
      async () => {
        await assert.rejects(
          registerForEvent(reservedStudent, event.id),
          /already registered/,
        );
        await assert.rejects(
          registerForEvent(organizer, event.id),
          /Only students/,
        );
      },
    );
    await t.test(
      "cancellation affects only the authenticated student and releases a place",
      async () => {
        await cancelRegistration(other, event.id);
        assert.equal(
          await db
            .collection("registrations")
            .countDocuments({ eventId: event.id }),
          3,
        );
        await cancelRegistration(reservedStudent, event.id);
        assert.equal(
          await db
            .collection("registrations")
            .countDocuments({ eventId: event.id }),
          2,
        );
        await registerForEvent(reservedStudent, event.id);
        assert.equal(
          await db
            .collection("registrations")
            .countDocuments({ eventId: event.id }),
          3,
        );
      },
    );
    await t.test(
      "nonexistent and started events cannot be registered",
      async () => {
        await assert.rejects(
          registerForEvent(students[0], "missing-" + prefix),
          /does not exist/,
        );
        await db
          .collection("events")
          .updateOne(
            { id: event.id },
            { $set: { startsAt: new Date(Date.now() - 1000) } },
          );
        await assert.rejects(registerForEvent(students[0], event.id), /closed/);
        await assert.rejects(
          cancelRegistration(reservedStudent, event.id),
          /closed/,
        );
      },
    );
    await t.test(
      "sign-up ignores injected organizer role and hashes the password",
      async () => {
        const response = await request("/sign-up/email", {
          email,
          name: "Auth Student",
          password: "A-strong-test-password-2026",
          role: "ORGANIZER",
        });
        assert.equal(response.status, 200, await response.text());
        const user = await db.collection("user").findOne({ email });
        assert.ok(user);
        assert.equal(user.role, "STUDENT");
        const account = await db
          .collection("account")
          .findOne({
            userId: {
              $in: [user.id, user._id, user._id.toString()].filter(Boolean),
            },
          });
        assert.ok(account);
        assert.notEqual(account.password, "A-strong-test-password-2026");
        assert.ok(account.password?.length);
      },
    );
    await t.test(
      "sign-in, HttpOnly cookies, session validation and revocation work",
      async () => {
        const bad = await request("/sign-in/email", {
          email,
          password: "wrong-password",
        });
        assert.equal(bad.status, 401);
        const response = await request("/sign-in/email", {
          email,
          password: "A-strong-test-password-2026",
        });
        assert.equal(response.status, 200);
        const cookies = response.headers.getSetCookie();
        assert.ok(cookies.some((c) => /httponly/i.test(c)));
        const cookie = cookies.map((c) => c.split(";")[0]).join("; ");
        const session = await request("/get-session", undefined, cookie);
        const data = await session.json();
        assert.equal(data.user.email, email);
        const fake = await request(
          "/get-session",
          undefined,
          "better-auth.session_token=fake",
        );
        assert.equal(await fake.json(), null);
        const rejected = await request(
          "/sign-out",
          {},
          cookie,
          "https://evil.example",
        );
        assert.equal(rejected.status, 403);
        const out = await request("/sign-out", {}, cookie);
        assert.equal(out.status, 200);
        const revoked = await request("/get-session", undefined, cookie);
        assert.equal(await revoked.json(), null);
      },
    );
    await t.test(
      "database auth rate limits reject repeated bad logins",
      async () => {
        let limited = false;
        for (let i = 0; i < 8; i++) {
          const response = await request("/sign-in/email", {
            email,
            password: "wrong-password",
          });
          if (response.status === 429) {
            limited = true;
            break;
          }
        }
        assert.ok(limited, "expected 429 after repeated attempts");
      },
    );
  } finally {
    try {
      await cleanupTestData(prefix);
    } finally {
      await client.close();
    }
  }
});
