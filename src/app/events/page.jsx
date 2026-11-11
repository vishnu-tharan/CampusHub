import Link from "next/link";
import {
  ArrowUpRight,
  Search,
  CalendarDays,
  Users,
  Sparkles,
} from "lucide-react";
import { db, toIdFilter } from "@/lib/db";
import { categories, categoryLabels } from "@/lib/validation";
import { EventCard } from "@/components/event-card";
import { campusTimeZone } from "@/lib/time";
export const metadata = { title: "Explore events" };
export default async function EventsPage({ searchParams }) {
  const params = await searchParams;
  const first = (value) =>
    Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  const q = first(params.q).slice(0, 120).trim();
  const category = categories.find((c) => c === first(params.category));
  const showPast = first(params.past) === "1";
  const requestedPage = Math.max(
    1,
    Math.min(10000, Number.parseInt(first(params.page) || "1", 10) || 1),
  );
  const filter = {};
  if (!showPast) {
    filter.startsAt = { $gt: new Date() };
    filter.status = "PUBLISHED";
  }
  if (category) filter.category = category;
  if (q) {
    const matchingClubs = await db
      .collection("clubs")
      .find({ name: { $regex: q, $options: "i" } }, { projection: { id: 1 } })
      .toArray();
    const clubIds = matchingClubs.map((c) => c.id ?? c._id.toString());
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { clubId: { $in: clubIds } },
    ];
  }
  const [count, clubCount] = await Promise.all([
    db.collection("events").countDocuments(filter),
    db.collection("clubs").countDocuments(),
  ]);
  const pages = Math.max(1, Math.ceil(count / 9));
  const page = Math.min(requestedPage, pages);
  const rawEvents = await db
    .collection("events")
    .find(filter)
    .sort({ startsAt: 1 })
    .skip((page - 1) * 9)
    .limit(9)
    .toArray();
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
  const href = (p) =>
    "/events?" +
    new URLSearchParams({
      q,
      category: category ?? "",
      past: showPast ? "1" : "",
      page: String(p),
    });
  return (
    <div className="shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-dot" /> YOUR CAMPUS, CONNECTED
          </p>
          <h1>
            Where campus moments
            <br />
            turn into <em>stories.</em>
          </h1>
          <p className="hero-description">
            Meet your people. Try something new. Find the moments that make
            university more than a timetable.
          </p>
          <div className="hero-actions">
            <a href="#discover" className="button">
              Find your next event <ArrowUpRight size={17} />
            </a>
            <Link href="/clubs" className="text-link">
              Meet the clubs →
            </Link>
          </div>
          <div className="hero-stats">
            <span>
              <CalendarDays size={17} />
              <strong>{count}</strong> {showPast ? "events" : "upcoming events"}
            </span>
            <span>
              <Users size={17} />
              <strong>{clubCount}</strong> campus clubs
            </span>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <span className="hero-star">✳</span>
          <div className="floating-note note-one">
            <span>◎</span>
            <div>
              Find your people<small>Join clubs & student initiatives</small>
            </div>
          </div>
          <div className="floating-note note-two">
            <Sparkles size={24} />
            <div>
              Reserve your place<small>Fast, real-time reservations</small>
            </div>
          </div>
          <span className="visual-caption">CAMPUS COMMUNITY PLATFORM</span>
        </div>
      </section>
      <section id="discover" className="discover">
        <div className="section-heading">
          <div>
            <p className="eyebrow">GET INVOLVED</p>
            <h2>What’s happening on campus</h2>
          </div>
          <span className="muted text-sm">
            All event times: {campusTimeZone}
          </span>
        </div>
        <form method="get" className="filter-bar">
          <div className="search-box">
            <Search size={18} />
            <label className="sr-only" htmlFor="search">
              Search events or clubs
            </label>
            <input
              id="search"
              name="q"
              defaultValue={q}
              placeholder="Search events or clubs…"
            />
          </div>
          <label className="sr-only" htmlFor="category">
            Category
          </label>
          <select name="category" id="category" defaultValue={category ?? ""}>
            <option value="">All interests</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {categoryLabels[c]}
              </option>
            ))}
          </select>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="past"
              value="1"
              defaultChecked={showPast}
            />{" "}
            Include past
          </label>
          <button className="button small">Find events</button>
        </form>
        <div className="results-heading">
          <p className="muted text-sm">
            {count} event{count === 1 ? "" : "s"} to explore
          </p>
          {(q || category || showPast) && (
            <Link className="text-link text-sm" href="/events">
              Clear filters
            </Link>
          )}
        </div>
        {events.length ? (
          <div className="event-grid">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <CalendarDays size={34} />
            <h3>No events here yet</h3>
            <p>
              Try another search, or check back when a club publishes something
              new.
            </p>
            <Link className="text-link" href="/events">
              View all events →
            </Link>
          </div>
        )}
        {pages > 1 && (
          <nav className="pagination" aria-label="Event pages">
            {page > 1 && (
              <Link className="button secondary small" href={href(page - 1)}>
                Previous
              </Link>
            )}
            <span>
              Page {page} of {pages}
            </span>
            {page < pages && (
              <Link className="button secondary small" href={href(page + 1)}>
                Next
              </Link>
            )}
          </nav>
        )}
      </section>
      <aside className="join-banner">
        <div>
          <p className="eyebrow">RUN A CAMPUS CLUB?</p>
          <h2>Bring your community together.</h2>
          <p>
            Put your next event on the map and make it easy for students to
            join.
          </p>
        </div>
        <Link className="button secondary" href="/organizer">
          Organizer workspace <ArrowUpRight size={18} />
        </Link>
      </aside>
    </div>
  );
}
