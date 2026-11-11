import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db, client, normalizeDoc } from "../src/lib/db.js";
import { createTestUser, cleanupTestData } from "./mongo-fixtures.js";
import {
  createClub,
  createEvent,
  updateEvent,
  cancelEvent,
  registerForEvent,
} from "../src/lib/events.js";
test("event changes preserve ownership, capacity, and booking history", async (suite) => {
  const prefix = "event-test-" + randomUUID();
  const owner = await createTestUser({
    name: "Test Organizer",
    email: prefix + "-owner@campushub.test",
    role: "ORGANIZER",
  });
  const other = await createTestUser({
    name: "Other Organizer",
    email: prefix + "-other@campushub.test",
    role: "ORGANIZER",
  });
  const student = await createTestUser({
    name: "Test Student",
    email: prefix + "-student@campushub.test",
  });
  try {
    const club = await createClub(owner, {
      name: prefix,
      description: "A club for testing event ownership.",
    });
    const foreignClub = await createClub(other, {
      name: prefix,
      description: "Another club for permission testing.",
    });
    const input = {
      title: "Campus testing workshop",
      description: "Students learn by building and explaining useful projects.",
      location: "Campus Lab",
      category: "TECHNOLOGY",
      clubId: club.id,
      capacity: 2,
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      endsAt: new Date(Date.now() + 90000000).toISOString(),
    };
    const event = await createEvent(owner, input);
    await registerForEvent(student, event.id);
    await suite.test(
      "duplicate club creation has a useful error, including simultaneous requests",
      async () => {
        await assert.rejects(
          createClub(owner, {
            name: prefix,
            description: "A duplicate community.",
          }),
          /already have a club/,
        );
        const attempts = await Promise.allSettled(
          [0, 1].map(() =>
            createClub(owner, {
              name: prefix + "-concurrent",
              description: "A concurrent club creation check.",
            }),
          ),
        );
        assert.equal(
          attempts.filter((attempt) => attempt.status === "fulfilled").length,
          1,
        );
      },
    );
    await suite.test("only the current owner can edit or cancel", async () => {
      await assert.rejects(
        updateEvent(other, event.id, input, 0),
        /own events/,
      );
      await assert.rejects(
        cancelEvent(other, event.id, "Room unavailable", 0),
        /own events/,
      );
      await assert.rejects(
        updateEvent(owner, event.id, { ...input, clubId: foreignClub.id }, 0),
        /own clubs/,
      );
      normalizeDoc(
        await db
          .collection("user")
          .findOneAndUpdate(
            { id: owner.id },
            { $set: { role: "STUDENT" } },
            { returnDocument: "after" },
          ),
      );
      await assert.rejects(
        updateEvent(owner, event.id, input, 0),
        /Organizer access/,
      );
      normalizeDoc(
        await db
          .collection("user")
          .findOneAndUpdate(
            { id: owner.id },
            { $set: { role: "ORGANIZER" } },
            { returnDocument: "after" },
          ),
      );
    });
    await suite.test(
      "capacity and stale forms cannot corrupt confirmed bookings",
      async () => {
        const second = await createTestUser({
          name: "Second Student",
          email: prefix + "-second@campushub.test",
        });
        await registerForEvent(second, event.id);
        await assert.rejects(
          updateEvent(owner, event.id, { ...input, capacity: 1 }, 0),
          /below/,
        );
        const updated = await updateEvent(
          owner,
          event.id,
          { ...input, location: "Library Workshop Room" },
          0,
        );
        assert.equal(updated.revision, 1);
        assert.equal(updated.location, "Library Workshop Room");
        await assert.rejects(
          updateEvent(owner, event.id, input, 0),
          /another tab/,
        );
        await assert.rejects(updateEvent(owner, event.id, input, null));
        assert.equal(
          await db
            .collection("registrations")
            .countDocuments({ eventId: event.id }),
          2,
        );
      },
    );
    await suite.test(
      "cancellation keeps registrations and closes further changes",
      async () => {
        await assert.rejects(cancelEvent(owner, event.id, "x", 1));
        await assert.rejects(
          cancelEvent(owner, event.id, "Room unavailable", 0),
          /another tab/,
        );
        const cancelled = await cancelEvent(
          owner,
          event.id,
          "Room unavailable",
          1,
        );
        assert.equal(cancelled.status, "CANCELLED");
        assert.equal(cancelled.cancellationReason, "Room unavailable");
        assert.equal(
          await db
            .collection("registrations")
            .countDocuments({ eventId: event.id }),
          2,
        );
        await assert.rejects(
          updateEvent(owner, event.id, input, 2),
          /cancelled/,
        );
        await assert.rejects(
          registerForEvent(other, event.id),
          /Only students/,
        );
        const repeated = await cancelEvent(
          owner,
          event.id,
          "Room unavailable",
          2,
        );
        assert.equal(repeated.revision, 2);
      },
    );
    await suite.test(
      "finished events cannot be edited or cancelled",
      async () => {
        const finished = await createEvent(owner, input);
        await db.collection("events").updateOne(
          { id: finished.id },
          {
            $set: {
              startsAt: new Date(Date.now() - 7200000),
              endsAt: new Date(Date.now() - 3600000),
            },
          },
        );
        await assert.rejects(
          updateEvent(owner, finished.id, input, 0),
          /closed/,
        );
        await assert.rejects(
          cancelEvent(owner, finished.id, "Event already finished", 0),
          /Finished/,
        );
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
