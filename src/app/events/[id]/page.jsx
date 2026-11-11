import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Users, ArrowLeft } from "lucide-react";
import { db, toIdFilter } from "@/lib/db";
import { getUser } from "@/lib/session";
import { categoryLabels } from "@/lib/validation";
import { formatDate, formatTime, campusTimeZone } from "@/lib/time";
import { RegistrationForm } from "@/components/registration-form";
export default async function EventPage({ params }) {
  const { id } = await params;
  const rawEvent = await db.collection("events").findOne(toIdFilter(id));
  if (!rawEvent) notFound();
  const eventId = rawEvent.id ?? rawEvent._id.toString();
  const [club, regCount, user] = await Promise.all([
    db.collection("clubs").findOne(toIdFilter(rawEvent.clubId)),
    db.collection("registrations").countDocuments({ eventId }),
    getUser(),
  ]);
  const event = {
    id: eventId,
    ...rawEvent,
    club: club
      ? {
          id: club.id ?? club._id.toString(),
          name: club.name,
          description: club.description,
        }
      : { name: "Campus Club", description: "" },
    _count: { registrations: regCount },
  };
  const registration = user
    ? await db
        .collection("registrations")
        .findOne({ userId: user.id, eventId })
    : null;
  const remaining = Math.max(0, event.capacity - event._count.registrations);
  const cancelled = event.status === "CANCELLED";
  const closed = cancelled || event.startsAt <= new Date();
  let registrationMessage = "Free to join. Reserve your place below.";
  if (cancelled) registrationMessage = "This event will not take place.";
  else if (registration) registrationMessage = "Your place is confirmed.";
  else if (closed) registrationMessage = "Registration has closed.";
  else if (remaining === 0) registrationMessage = "This event is full.";
  return (
    <div className="shell page-space">
      <Link href="/events" className="back-link">
        <ArrowLeft size={16} /> Back to events
      </Link>
      {cancelled && (
        <div className="notice error mb-7">
          <strong>This event is cancelled.</strong>
          <p>{event.cancellationReason}</p>
        </div>
      )}
      <div className="detail-grid">
        <section>
          <p className="eyebrow">{event.club.name}</p>
          <span className="badge">{categoryLabels[event.category]}</span>
          <h1 className="page-title mt-4">{event.title}</h1>
          <p className="muted mt-4">Organized by {event.club.name}</p>
          <div
            className={"detail-art art-" + event.category.toLowerCase()}
            aria-hidden="true"
          >
            <span>✦</span>
            <p>
              Connect, collaborate &
              <br />
              grow with your peers.
            </p>
          </div>
          <h2 className="mt-8">About this event</h2>
          <p className="event-description">{event.description}</p>
          <div className="panel mt-8">
            <h3>Meet {event.club.name}</h3>
            <p className="muted mt-2">{event.club.description}</p>
            <Link
              href={"/clubs/" + event.clubId}
              className="text-link mt-4 inline-block"
            >
              Visit club →
            </Link>
          </div>
        </section>
        <aside className="panel detail-aside">
          <p className="eyebrow">YOUR NEXT CAMPUS MOMENT</p>
          <h2>Event details</h2>
          <dl className="detail-facts">
            <div>
              <CalendarDays size={20} />
              <div>
                <dt>When</dt>
                <dd>
                  {formatDate(event.startsAt)} · {formatTime(event.startsAt)}
                  <br />
                  Ends {formatDate(event.endsAt)} · {formatTime(event.endsAt)}
                  <small>{campusTimeZone}</small>
                </dd>
              </div>
            </div>
            <div>
              <MapPin size={20} />
              <div>
                <dt>Where</dt>
                <dd>{event.location}</dd>
              </div>
            </div>
            <div>
              <Users size={20} />
              <div>
                <dt>Places</dt>
                <dd>
                  {event._count.registrations} / {event.capacity} confirmed
                  <small>{remaining} places available</small>
                </dd>
              </div>
            </div>
          </dl>
          {user?.role === "STUDENT" ? (
            <>
              <p className="muted text-sm mb-4">{registrationMessage}</p>
              <RegistrationForm
                eventId={id}
                registered={!!registration}
                closed={closed}
                full={!remaining}
              />
            </>
          ) : user?.role === "ORGANIZER" ? (
            <p className="notice">
              Student accounts reserve places. Organizers manage their own
              events.
            </p>
          ) : (
            <Link href="/login" className="button w-full">
              Sign in to register
            </Link>
          )}
          {user?.id === event.organizerId && user.role === "ORGANIZER" && (
            <div className="form-stack mt-5">
              <Link className="text-link" href={"/organizer/events/" + id}>
                View registrations →
              </Link>
              {!closed && (
                <Link
                  className="text-link"
                  href={"/organizer/events/" + id + "/edit"}
                >
                  Edit event →
                </Link>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
