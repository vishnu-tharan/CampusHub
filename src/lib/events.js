import { randomUUID } from "node:crypto";
import { db, toIdFilter, normalizeDoc } from "./db.js";
import {
  clubSchema,
  eventSchema,
  idSchema,
  revisionSchema,
  cancellationSchema,
} from "./validation.js";

export class DomainError extends Error {}

async function requireOrganizer(actor) {
  const user = await db.collection("user").findOne(toIdFilter(actor.id));
  if (user?.role !== "ORGANIZER") {
    throw new DomainError("Organizer access is required.");
  }
}

async function getEvent(eventId) {
  idSchema.parse(eventId);
  const event = await db.collection("events").findOne(toIdFilter(eventId));
  if (!event) throw new DomainError("This event does not exist.");
  return normalizeDoc(event);
}

async function ownedEvent(actor, eventId) {
  const event = await getEvent(eventId);
  await requireOrganizer(actor);
  if (event.organizerId !== actor.id) {
    throw new DomainError("You can only manage your own events.");
  }
  return event;
}

function requireOpenEvent(event) {
  if (event.status === "CANCELLED") {
    throw new DomainError("This event has been cancelled.");
  }
  if (new Date(event.startsAt) <= new Date()) {
    throw new DomainError("Registration has closed.");
  }
}

export async function createClub(actor, input) {
  const details = clubSchema.parse(input);
  await requireOrganizer(actor);
  const existing = await db.collection("clubs").findOne({
    ownerId: actor.id,
    name: details.name,
  });
  if (existing) {
    throw new DomainError("You already have a club with that name.");
  }
  const id = randomUUID();
  const now = new Date();
  const club = {
    id,
    ...details,
    ownerId: actor.id,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection("clubs").insertOne(club);
  return normalizeDoc(club);
}

export async function createEvent(actor, input) {
  const details = eventSchema.parse(input);
  await requireOrganizer(actor);
  const club = await db.collection("clubs").findOne({
    ...toIdFilter(details.clubId),
    ownerId: actor.id,
  });
  if (!club) {
    throw new DomainError("You can only publish events for your own clubs.");
  }
  const id = randomUUID();
  const now = new Date();
  const event = {
    id,
    ...details,
    startsAt: new Date(details.startsAt),
    endsAt: new Date(details.endsAt),
    organizerId: actor.id,
    status: "PUBLISHED",
    cancellationReason: null,
    revision: 0,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection("events").insertOne(event);
  return normalizeDoc(event);
}

export async function updateEvent(actor, eventId, input, expectedRevision) {
  const details = eventSchema.parse(input);
  const revision = revisionSchema.parse(expectedRevision);
  const event = await ownedEvent(actor, eventId);
  requireOpenEvent(event);
  if (event.revision !== revision) {
    throw new DomainError(
      "This event changed in another tab. Reload before saving.",
    );
  }
  const club = await db.collection("clubs").findOne({
    ...toIdFilter(details.clubId),
    ownerId: actor.id,
  });
  if (!club) {
    throw new DomainError("You can only publish events for your own clubs.");
  }
  const registrationsCount = await db
    .collection("registrations")
    .countDocuments({ eventId });
  if (details.capacity < registrationsCount) {
    throw new DomainError(
      "Capacity cannot be below the number of registered students.",
    );
  }
  const updated = await db.collection("events").findOneAndUpdate(
    toIdFilter(eventId),
    {
      $set: {
        ...details,
        startsAt: new Date(details.startsAt),
        endsAt: new Date(details.endsAt),
        updatedAt: new Date(),
      },
      $inc: { revision: 1 },
    },
    { returnDocument: "after" },
  );
  return normalizeDoc(updated);
}

export async function cancelEvent(actor, eventId, input, expectedRevision) {
  const reason = cancellationSchema.parse(input);
  const revision = revisionSchema.parse(expectedRevision);
  const event = await ownedEvent(actor, eventId);
  if (event.status === "CANCELLED") return event;
  if (event.revision !== revision) {
    throw new DomainError(
      "This event changed in another tab. Reload before cancelling.",
    );
  }
  if (new Date(event.endsAt) <= new Date()) {
    throw new DomainError("Finished events cannot be cancelled.");
  }
  const updated = await db.collection("events").findOneAndUpdate(
    toIdFilter(eventId),
    {
      $set: {
        status: "CANCELLED",
        cancellationReason: reason,
        updatedAt: new Date(),
      },
      $inc: { revision: 1 },
    },
    { returnDocument: "after" },
  );
  return normalizeDoc(updated);
}

export async function registerForEvent(actor, eventId) {
  const event = await getEvent(eventId);
  const user = await db.collection("user").findOne(toIdFilter(actor.id));
  if (user?.role !== "STUDENT") {
    throw new DomainError("Only students can register for events.");
  }
  requireOpenEvent(event);
  const existing = await db
    .collection("registrations")
    .findOne({ userId: actor.id, eventId });
  if (existing) {
    throw new DomainError("You are already registered for this event.");
  }
  const registrations = await db
    .collection("registrations")
    .find({ eventId })
    .toArray();
  await db
    .collection("events")
    .updateOne(
      { ...toIdFilter(eventId), bookingUserIds: { $exists: false } },
      { $set: { bookingUserIds: registrations.map((item) => item.userId) } },
    );
  const reserved = await db.collection("events").findOneAndUpdate(
    {
      ...toIdFilter(eventId),
      status: "PUBLISHED",
      startsAt: { $gt: new Date() },
      bookingUserIds: { $ne: actor.id },
      $expr: { $lt: [{ $size: "$bookingUserIds" }, "$capacity"] },
    },
    { $addToSet: { bookingUserIds: actor.id } },
    { returnDocument: "after" },
  );
  if (!reserved) {
    const current = await getEvent(eventId);
    requireOpenEvent(current);
    if (current.bookingUserIds?.includes(actor.id)) {
      throw new DomainError("You are already registered for this event.");
    }
    throw new DomainError("This event is full.");
  }
  const registration = {
    id: randomUUID(),
    eventId,
    userId: actor.id,
    createdAt: new Date(),
  };
  try {
    await db.collection("registrations").insertOne(registration);
  } catch (error) {
    await db
      .collection("events")
      .updateOne(toIdFilter(eventId), { $pull: { bookingUserIds: actor.id } });
    throw error;
  }
  return registration;
}

export async function cancelRegistration(actor, eventId) {
  const event = await getEvent(eventId);
  requireOpenEvent(event);
  const result = await db
    .collection("registrations")
    .deleteMany({ userId: actor.id, eventId });
  await db
    .collection("events")
    .updateOne(toIdFilter(eventId), { $pull: { bookingUserIds: actor.id } });
  return result;
}
