import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
const url = process.env.BETTER_AUTH_URL ?? "http://localhost:3001";
test("public production pages render real content", async () => {
  for (const [path, text] of [
    ["/events", "Where campus moments"],
    ["/clubs", "Find your people."],
    ["/login", "Good to see you."],
    ["/signup", "Make campus yours."],
  ]) {
    const response = await fetch(url + path);
    assert.equal(response.status, 200, path);
    assert.ok((await response.text()).includes(text), path);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("x-frame-options"), "DENY");
    assert.equal(
      response.headers.get("permissions-policy"),
      "camera=(), microphone=(), geolocation=()",
    );
  }
});
test("repeated filter parameters do not crash the page", async () => {
  const response = await fetch(
    url +
      "/events?q=build&q=ignored&category=TECHNOLOGY&category=ARTS&page=1&page=2",
  );
  assert.equal(response.status, 200);
  assert.ok((await response.text()).includes("What"));
});
test("protected pages reject anonymous and forged sessions", async () => {
  for (const path of [
    "/dashboard",
    "/organizer",
    "/organizer/events/new",
    "/organizer/events/build-night",
  ]) {
    for (const cookie of ["", "better-auth.session_token=forged"]) {
      const response = await fetch(url + path, {
        redirect: "manual",
        headers: { cookie },
      });
      if (response.status === 307)
        assert.equal(
          new URL(response.headers.get("location"), url).pathname,
          "/login",
        );
      else {
        assert.equal(response.status, 200);
        const html = await response.text();
        assert.ok(
          html.includes('id="__next-page-redirect"') &&
            html.includes("url=/login"),
          "expected streamed login redirect",
        );
        for (const privateText of [
          "Your upcoming events",
          "Bring people together.",
          "Create your next event.",
          "ATTENDEE LIST",
        ])
          assert.ok(!html.includes(privateText), "private content was exposed");
      }
    }
  }
});
test("nonexistent events render the not-found result", async () => {
  const response = await fetch(url + "/events/missing-event-smoke-test");
  if (response.status !== 404) {
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(html.includes("NEXT_HTTP_ERROR_FALLBACK;404"));
    assert.ok(html.includes('name="robots" content="noindex"'));
  }
});
test("a forged cookie does not create an auth session", async () => {
  const response = await fetch(url + "/api/auth/get-session", {
    headers: { cookie: "better-auth.session_token=forged" },
  });
  assert.equal(response.status, 200);
  assert.equal(await response.json(), null);
});
test("health endpoint confirms MongoDB is reachable", async () => {
  const response = await fetch(url + "/api/health");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
  assert.equal(response.headers.get("cache-control"), "no-store");
});
