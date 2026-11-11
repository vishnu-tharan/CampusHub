import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { client, db } from "../src/lib/db.js";

async function main() {
  const password = process.env.SEED_DEMO_PASSWORD ?? "CampusHub-Demo-2026!";
  if (password.length < 12) {
    throw new Error("Set SEED_DEMO_PASSWORD to at least 12 characters in .env.");
  }

  const hashed = await hashPassword(password);

  const people = [
    {
      id: "demo-organizer",
      name: "Demo Organizer",
      email: "organizer@campushub.test",
      role: "ORGANIZER",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "demo-student",
      name: "Demo Student",
      email: "student@campushub.test",
      role: "STUDENT",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const person of people) {
    await db.collection("user").updateOne(
      { email: person.email },
      { $set: person },
      { upsert: true },
    );

    const user = await db.collection("user").findOne({ email: person.email });
    const userId = user.id ?? user._id.toString();

    await db.collection("account").updateOne(
      { providerId: "credential", accountId: person.id },
      {
        $set: {
          id: person.id + "-account",
          accountId: person.id,
          providerId: "credential",
          userId: userId,
          password: hashed,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  const clubs = [
    {
      id: "computing-society",
      name: "Computing Society",
      description:
        "Build useful things, share ideas, and learn with people who love technology.",
      ownerId: "demo-organizer",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "creative-collective",
      name: "Creative Collective",
      description:
        "A welcoming space for music, art, photography, and creative experiments.",
      ownerId: "demo-organizer",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "campus-active",
      name: "Campus Active",
      description:
        "Move more, meet new friends, and enjoy friendly sport at every skill level.",
      ownerId: "demo-organizer",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const club of clubs) {
    await db.collection("clubs").updateOne(
      { id: club.id },
      { $set: club },
      { upsert: true },
    );
  }

  const events = [
    {
      id: "build-night",
      title: "Build night: ideas into apps",
      clubId: "computing-society",
      category: "TECHNOLOGY",
      location: "Innovation Lab",
      capacity: 40,
      description:
        "Bring your laptop and a small idea. Work in friendly teams to build a web app, share your progress, and learn from other students. Beginners are very welcome.",
    },
    {
      id: "open-mic",
      title: "An evening of open mic",
      clubId: "creative-collective",
      category: "ARTS",
      location: "Student Centre",
      capacity: 80,
      description:
        "Music, poetry, comedy, and good company. Take the stage or settle in with friends for an evening celebrating campus creativity. No performance experience needed.",
    },
    {
      id: "friendly-badminton",
      title: "Badminton & new beginnings",
      clubId: "campus-active",
      category: "SPORTS",
      location: "Sports Hall",
      capacity: 24,
      description:
        "Join a relaxed afternoon of badminton and meet students from across campus. We will provide rackets and pair you with players at a similar level.",
    },
    {
      id: "portfolio-lab",
      title: "Your first developer portfolio",
      clubId: "computing-society",
      category: "CAREER",
      location: "Library Workshop Room",
      capacity: 35,
      description:
        "Turn your projects into a clear portfolio story. Learn how to explain your decisions, demonstrate working software, and prepare for your first developer interview.",
    },
    {
      id: "photo-walk",
      title: "See campus through a new lens",
      clubId: "creative-collective",
      category: "ARTS",
      location: "Main Gate",
      capacity: 30,
      description:
        "A slow photography walk around campus. Bring a camera or your phone, notice the small details, and swap creative ideas with other students.",
    },
    {
      id: "community-morning",
      title: "A little good: community morning",
      clubId: "campus-active",
      category: "COMMUNITY",
      location: "Campus Garden",
      capacity: 50,
      description:
        "Help brighten our campus garden with a morning of planting and shared conversation. Gloves and tools are provided. Bring water and your curiosity.",
    },
  ];

  for (const [index, event] of events.entries()) {
    const startsAt = new Date(Date.now() + (index + 3) * 86400000);
    startsAt.setUTCHours(10, 30, 0, 0);
    const endsAt = new Date(startsAt.getTime() + 2 * 3600000);
    await db.collection("events").updateOne(
      { id: event.id },
      {
        $set: {
          ...event,
          organizerId: "demo-organizer",
          status: "PUBLISHED",
          cancellationReason: null,
          revision: 0,
          startsAt,
          endsAt,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  await db.collection("registrations").updateOne(
    { userId: "demo-student", eventId: "build-night" },
    {
      $set: {
        id: "demo-registration-1",
        userId: "demo-student",
        eventId: "build-night",
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );

  console.log(
    "MongoDB Seed Ready: 2 demo accounts, 3 clubs, 6 events, 1 registration.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => client.close());
