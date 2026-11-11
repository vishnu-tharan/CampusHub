import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db, client, normalizeDoc } from "../src/lib/db.js";
import { cleanupTestData } from "./mongo-fixtures.js";
import { auth } from "../src/lib/auth.js";
import {
  createClub,
  createEvent,
  registerForEvent,
  cancelEvent,
} from "../src/lib/events.js";
const origin = process.env.BETTER_AUTH_URL ?? "http://localhost:3001";
test("student and organizer pages show only authorized records", async (suite) => {
  const prefix = "page-test-" + randomUUID();
  async function account(label, role) {
    const email = prefix + "-" + label + "@campushub.test";
    const response = await auth.handler(
      new Request(origin + "/api/auth/sign-up/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          origin,
          "x-forwarded-for":
            "2001:db8:" + randomUUID().slice(0, 4) + ":abcd::1",
        },
        body: JSON.stringify({
          email,
          name: "Test " + label,
          password: "A-strong-page-test-password-2026",
        }),
      }),
    );
    assert.equal(response.status, 200);
    const cookie = response.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    const user = normalizeDoc(
      await db
        .collection("user")
        .findOneAndUpdate(
          { email },
          { $set: { role } },
          { returnDocument: "after" },
        ),
    );
    return { ...user, cookie };
  }
  const page = async (path, cookie = "") => {
    const response = await fetch(origin + path, {
      headers: { cookie },
      redirect: "manual",
    });
    return { response, html: await response.text() };
  };
  try {
    const owner = await account("owner", "ORGANIZER");
    const other = await account("other", "ORGANIZER");
    const student = await account("student", "STUDENT");
    const outsider = await account("outsider", "STUDENT");
    const club = await createClub(owner, {
      name: prefix,
      description: "A public club description for an isolated page check.",
    });
    const event = await createEvent(owner, {
      title: "Private roster workshop",
      description:
        "A campus workshop for testing page permissions and registration.",
      location: "Campus Lab",
      category: "TECHNOLOGY",
      clubId: club.id,
      capacity: 3,
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      endsAt: new Date(Date.now() + 90000000).toISOString(),
    });
    await registerForEvent(student, event.id);
    await suite.test(
      "public event and club pages do not reveal account names or emails",
      async () => {
        for (const path of ["/events/" + event.id, "/clubs/" + club.id]) {
          const result = await page(path);
          assert.equal(result.response.status, 200);
          assert.ok(!result.html.includes(owner.name));
          assert.ok(!result.html.includes(student.email));
        }
      },
    );
    await suite.test(
      "each student sees only their own registrations and signed-in name",
      async () => {
        const own = await page("/dashboard", student.cookie);
        assert.ok(own.html.includes(event.title));
        assert.ok(own.html.includes(student.name));
        const foreign = await page("/dashboard", outsider.cookie);
        assert.ok(!foreign.html.includes(event.title));
        assert.ok(
          (await page("/events/" + event.id, student.cookie)).html.includes(
            "Your place is confirmed.",
          ),
        );
      },
    );
    await suite.test(
      "only the owning organizer sees the roster and edit form",
      async () => {
        const own = await page("/organizer/events/" + event.id, owner.cookie);
        assert.ok(own.html.includes(student.email));
        assert.ok(
          (
            await page("/organizer/events/" + event.id + "/edit", owner.cookie)
          ).html.includes("Save changes"),
        );
        for (const path of [
          "/organizer/events/" + event.id,
          "/organizer/events/" + event.id + "/edit",
        ]) {
          const foreign = await page(path, other.cookie);
          assert.ok(
            foreign.response.status === 404 ||
              foreign.html.includes("NEXT_HTTP_ERROR_FALLBACK;404"),
          );
          assert.ok(!foreign.html.includes(student.email));
        }
        const denied = await page("/organizer", student.cookie);
        assert.ok(
          denied.response.status === 307 ||
            denied.html.includes("url=/dashboard"),
        );
        assert.ok(!denied.html.includes("Bring people together."));
      },
    );
    await suite.test(
      "cancelled registrations remain visible with the reason",
      async () => {
        await cancelEvent(
          owner,
          event.id,
          "Room unavailable for this workshop",
          0,
        );
        const dashboard = await page("/dashboard", student.cookie);
        assert.ok(dashboard.html.includes("Past and cancelled events"));
        assert.ok(
          dashboard.html.includes("Room unavailable for this workshop"),
        );
        const detail = await page("/events/" + event.id, student.cookie);
        assert.ok(detail.html.includes("Registration closed"));
        assert.ok(
          (
            await page("/organizer/events/" + event.id, owner.cookie)
          ).html.includes(student.email),
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
