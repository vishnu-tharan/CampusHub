import { randomUUID } from "node:crypto";
import { db, normalizeDoc } from "../src/lib/db.js";

export async function createTestUser(data) {
  const user = {
    id: randomUUID(),
    role: "STUDENT",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
  };
  await db.collection("user").insertOne(user);
  return normalizeDoc(user);
}

export async function cleanupTestData(prefix) {
  const users = await db
    .collection("user")
    .find({ email: { $regex: "^" + prefix } })
    .toArray();
  const userIds = users
    .flatMap((user) => [user.id, user._id, user._id?.toString()])
    .filter(Boolean);
  const events = await db
    .collection("events")
    .find({ organizerId: { $in: userIds } })
    .toArray();
  const eventIds = events.map((event) => event.id ?? event._id.toString());
  await db
    .collection("registrations")
    .deleteMany({
      $or: [{ userId: { $in: userIds } }, { eventId: { $in: eventIds } }],
    });
  await db.collection("events").deleteMany({ organizerId: { $in: userIds } });
  await db.collection("clubs").deleteMany({ ownerId: { $in: userIds } });
  await db.collection("session").deleteMany({ userId: { $in: userIds } });
  await db.collection("account").deleteMany({ userId: { $in: userIds } });
  await db
    .collection("user")
    .deleteMany({ _id: { $in: users.map((user) => user._id) } });
}
