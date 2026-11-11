import Link from "next/link";
import { Plus } from "lucide-react";
import { requireOrganizer } from "@/lib/session";
import { db, toIdFilter } from "@/lib/db";
import { ClubForm } from "@/components/club-form";
import { formatDate } from "@/lib/time";
export const metadata = { title: "Organizer workspace" };
export default async function Organizer() {
  const user = await requireOrganizer();
  const [rawClubs, rawEvents] = await Promise.all([
    db
      .collection("clubs")
      .find({ ownerId: user.id })
      .sort({ name: 1 })
      .toArray(),
    db
      .collection("events")
      .find({ organizerId: user.id })
      .sort({ startsAt: -1 })
      .toArray(),
  ]);
  const clubs = rawClubs.map((club) => ({
    id: club.id ?? club._id.toString(),
    ...club,
  }));
  const events = await Promise.all(
    rawEvents.map(async (event) => {
      const eventId = event.id ?? event._id.toString();
      const [club, regCount] = await Promise.all([
        db.collection("clubs").findOne(toIdFilter(event.clubId)),
        db.collection("registrations").countDocuments({ eventId }),
      ]);
      return {
        id: eventId,
        ...event,
        club: { name: club?.name ?? "Campus Club" },
        _count: { registrations: regCount },
      };
    }),
  );
  const publishedEvents = events.filter(
    (event) => event.status === "PUBLISHED",
  );
  const registrationCount = publishedEvents.reduce(
    (total, event) => total + event._count.registrations,
    0,
  );
  return (
    <div className="shell page-space">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ORGANIZER WORKSPACE</p>
          <h1 className="page-title">Bring people together.</h1>
          <p className="lead">
            Create clubs, publish events, and manage registrations.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {clubs.length > 0 && (
            <Link className="button" href="/organizer/events/new">
              <Plus size={18} />
              Create event
            </Link>
          )}
        </div>
      </div>
      <div className="stats-grid">
        <div className="panel">
          <p className="muted">Your clubs</p>
          <strong>{clubs.length}</strong>
        </div>
        <div className="panel">
          <p className="muted">Published events</p>
          <strong>{publishedEvents.length}</strong>
        </div>
        <div className="panel">
          <p className="muted">Registrations · published events</p>
          <strong>{registrationCount}</strong>
        </div>
      </div>
      <div className="organizer-grid">
        <section>
          <h2>Your events</h2>
          {events.length ? (
            <div className="registration-list">
              {events.map((event) => (
                <article className="panel" key={event.id}>
                  <p className="eyebrow">
                    {event.club.name} ·{" "}
                    {event.status === "CANCELLED" ? "CANCELLED" : "PUBLISHED"}
                  </p>
                  <h3>
                    <Link href={"/events/" + event.id}>{event.title}</Link>
                  </h3>
                  <p className="muted mt-2 text-sm">
                    {formatDate(event.startsAt)} · {event._count.registrations}/
                    {event.capacity} confirmed
                  </p>
                  <div className="flex flex-wrap gap-5 mt-4">
                    <Link
                      className="text-link text-sm"
                      href={"/organizer/events/" + event.id}
                    >
                      View registrations →
                    </Link>
                    {event.status === "PUBLISHED" &&
                      event.startsAt > new Date() && (
                        <Link
                          className="text-link text-sm"
                          href={"/organizer/events/" + event.id + "/edit"}
                        >
                          Edit event →
                        </Link>
                      )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>Your first event starts here.</h3>
              <p>
                {clubs.length
                  ? "Create an event for one of your clubs."
                  : "Create a club, then publish its first event."}
              </p>
            </div>
          )}
          <h2 className="mt-8">Your clubs</h2>
          <div className="registration-list">
            {clubs.map((club) => (
              <article className="panel" key={club.id}>
                <h3>
                  <Link href={"/clubs/" + club.id}>{club.name}</Link>
                </h3>
                <p className="muted mt-2">{club.description}</p>
                <Link
                  className="text-link inline-block mt-4"
                  href={"/clubs/" + club.id}
                >
                  View club →
                </Link>
              </article>
            ))}
          </div>
        </section>
        <aside className="panel self-start">
          <p className="eyebrow">GROW YOUR COMMUNITY</p>
          <h2 className="mb-5">Create a club</h2>
          <ClubForm />
        </aside>
      </div>
    </div>
  );
}
