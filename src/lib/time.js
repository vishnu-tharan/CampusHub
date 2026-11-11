import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
export const campusTimeZone = process.env.CAMPUS_TIME_ZONE ?? "Asia/Colombo";
export function formatDate(date) {
  return new Intl.DateTimeFormat("en", {
    timeZone: campusTimeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
export function formatTime(date) {
  return new Intl.DateTimeFormat("en", {
    timeZone: campusTimeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
export function toUtcTimestamp(localDateTime, timeZone) {
  const date = fromZonedTime(localDateTime, timeZone);
  if (Number.isNaN(date.getTime()))
    throw new Error("Enter a valid event time.");
  if (
    formatInTimeZone(date, timeZone, "yyyy-MM-dd'T'HH:mm") !== localDateTime
  ) {
    throw new Error(
      "This time does not exist in the campus timezone. Choose another time.",
    );
  }
  return date.toISOString();
}
