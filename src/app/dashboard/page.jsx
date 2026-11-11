import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { db, toIdFilter } from "@/lib/db";
import { formatDate, formatTime, campusTimeZone } from "@/lib/time";
import { RegistrationForm } from "@/components/registration-form";

export const metadata = { title: "My campus" };

export default async function Dashboard() {
  const user = await requireUser();
  if (user.role === "ORGANIZER") redirect("/organizer");

  const rawRegistrations = await db
    .collection("registrations")
    .find({ userId: user.id })
    .toArray();

  const registrations = (
    await Promise.all(
      rawRegistrations.map(async (reg) => {
        const event = await db
          .collection("events")
          .findOne(toIdFilter(reg.eventId));
        if (!event) return null;
        const club = await db
          .collection("clubs")
          .findOne(toIdFilter(event.clubId));
        return {
          id: reg.id ?? reg._id.toString(),
          ...reg,
          event: {
            id: event.id ?? event._id.toString(),
            ...event,
            club: { name: club?.name ?? "Campus Club" },
          },
        };
      }),
    )
  )
    .filter(Boolean)
    .sort((a, b) => new Date(a.event.startsAt) - new Date(b.event.startsAt));

  const now = new Date();
  const upcoming = registrations.filter(
    ({ event }) =>
      event.status === "PUBLISHED" && new Date(event.startsAt) > now,
  );
  const history = registrations.filter(
    ({ event }) =>
      event.status === "CANCELLED" || new Date(event.startsAt) <= now,
  );

  return (
    <div className="shell page-space">
      <div className="section-heading">
        <div>
          <p className="eyebrow">MY CAMPUS</p>
          <h1 className="page-title">Welcome, {user.name}.</h1>
          <p className="lead">Your registrations, all in one place.</p>
        </div>
        <Link href="/events" className="button secondary">
          Discover more
        </Link>
      </div>
      <p className="muted text-sm mt-7">Event times: {campusTimeZone}</p>
      <h2 className="mt-6">
        Your upcoming events <span className="badge">{upcoming.length}</span>
      </h2>
      {upcoming.length ? (
        <div className="registration-list">
          {upcoming.map(({ event }) => (
            <article className="panel registration-row" key={event.id}>
              <div>
                <p className="eyebrow">{event.club.name} · CONFIRMED</p>
                <h3>
                  <Link href={"/events/" + event.id}>{event.title}</Link>
                </h3>
                <p className="muted mt-2">
                  {formatDate(event.startsAt)} · {formatTime(event.startsAt)} ·{" "}
                  {event.location}
                </p>
              </div>
              <RegistrationForm eventId={event.id} registered />
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <CalendarDays size={32} />
          <h3>Your next campus moment is waiting.</h3>
          <p>Find an event and reserve your first place.</p>
          <Link href="/events" className="text-link">
            Explore events →
          </Link>
        </div>
      )}
      {history.length > 0 && (
        <section className="mt-10">
          <h2>Past and cancelled events</h2>
          <div className="registration-list">
            {history.map(({ event }) => (
              <article className="panel" key={event.id}>
                <p className="eyebrow">
                  {event.status === "CANCELLED" ? "CANCELLED" : "PAST EVENT"}
                </p>
                <h3>
                  <Link href={"/events/" + event.id}>{event.title}</Link>
                </h3>
                <p className="muted mt-2">
                  {formatDate(event.startsAt)} · {event.club.name}
                </p>
                {event.cancellationReason && (
                  <p className="notice">{event.cancellationReason}</p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
