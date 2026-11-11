import Link from "next/link";
import { ArrowUpRight, MapPin, Clock } from "lucide-react";
import { categoryLabels } from "@/lib/validation";
import { formatDate, formatTime } from "@/lib/time";
const glyphs = {
  TECHNOLOGY: "</>",
  ARTS: "✦",
  SPORTS: "⚡",
  COMMUNITY: "◎",
  CAREER: "★",
};
export function EventCard({ event }) {
  const available = Math.max(0, event.capacity - event._count.registrations);
  const past = event.startsAt <= new Date();
  let availabilityLabel = available + " places left";
  if (event.status === "CANCELLED") availabilityLabel = "Cancelled";
  else if (past) availabilityLabel = "Registration closed";
  else if (available === 0) availabilityLabel = "Event full";
  return (
    <article className="event-card">
      <Link
        className={"event-art art-" + event.category.toLowerCase()}
        href={"/events/" + event.id}
        tabIndex={-1}
        aria-hidden="true"
      >
        <span className="art-orbit" />
        <span className="art-glyph">{glyphs[event.category]}</span>
        <span className="art-label">{event.club.name}</span>
      </Link>
      <div className="event-card-body">
        <div className="flex items-center justify-between gap-3">
          <span className="badge">{categoryLabels[event.category]}</span>
          <span className="muted text-xs">{formatDate(event.startsAt)}</span>
        </div>
        <h3>
          <Link href={"/events/" + event.id}>{event.title}</Link>
        </h3>
        <p className="muted text-sm line-clamp-2">{event.description}</p>
        <div className="event-meta">
          <span>
            <MapPin size={14} />
            {event.location}
          </span>
          <span>
            <Clock size={14} />
            {formatTime(event.startsAt)}
          </span>
        </div>
        <div className="event-card-foot">
          <span className={available && !past ? "places" : "muted"}>
            {availabilityLabel}
          </span>
          <Link href={"/events/" + event.id} aria-label={"View " + event.title}>
            <ArrowUpRight size={19} />
          </Link>
        </div>
      </div>
    </article>
  );
}
