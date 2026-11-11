import Link from "next/link";
import { notFound } from "next/navigation";
import { db, toIdFilter } from "@/lib/db";
import { EventCard } from "@/components/event-card";

export default async function ClubPage({ params }) {
  const { id } = await params;
  const club = await db.collection("clubs").findOne(toIdFilter(id));
  if (!club) notFound();

  const clubId = club.id ?? club._id.toString();
  const rawEvents = await db
    .collection("events")
    .find({
      clubId,
      status: "PUBLISHED",
      startsAt: { $gt: new Date() },
    })
    .sort({ startsAt: 1 })
    .toArray();

  const events = await Promise.all(
    rawEvents.map(async (event) => {
      const eventId = event.id ?? event._id.toString();
      const regCount = await db
        .collection("registrations")
        .countDocuments({ eventId });
      return {
        id: eventId,
        ...event,
        club: { name: club.name },
        _count: { registrations: regCount },
      };
    }),
  );

  return (
    <div className="shell page-space">
      <Link href="/clubs" className="back-link">
        ← All clubs
      </Link>
      <p className="eyebrow">CAMPUS COMMUNITY</p>
      <h1 className="page-title">{club.name}</h1>
      <p className="lead">{club.description}</p>
      <h2 className="mt-9">Upcoming club events</h2>
      {events.length ? (
        <div className="event-grid mt-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No upcoming events right now.</h3>
          <Link className="text-link" href="/events">
            Explore other events →
          </Link>
        </div>
      )}
    </div>
  );
}
