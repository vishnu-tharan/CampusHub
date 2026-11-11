import { z } from "zod";
export const categories = [
  "TECHNOLOGY",
  "ARTS",
  "SPORTS",
  "COMMUNITY",
  "CAREER",
];
export const categoryLabels = {
  TECHNOLOGY: "Technology",
  ARTS: "Arts & culture",
  SPORTS: "Sports",
  COMMUNITY: "Community",
  CAREER: "Careers",
};
export const clubSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Club name needs at least 3 characters.")
    .max(80),
  description: z
    .string()
    .trim()
    .min(10, "Tell us a little more about the club.")
    .max(1000),
});
export const eventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, "Title needs at least 5 characters.")
      .max(120),
    description: z
      .string()
      .trim()
      .min(20, "Description needs at least 20 characters.")
      .max(5000),
    location: z.string().trim().min(3).max(160),
    category: z.enum(categories),
    clubId: z.string().min(1, "Choose a club."),
    startsAt: z.iso
      .datetime({ offset: true })
      .transform((value) => new Date(value)),
    endsAt: z.iso
      .datetime({ offset: true })
      .transform((value) => new Date(value)),
    capacity: z.coerce.number().int().min(1).max(10000),
  })
  .refine(
    (event) =>
      !(event.startsAt instanceof Date) ||
      event.startsAt.getTime() > Date.now(),
    { path: ["startsAt"], message: "Choose a future start time." },
  )
  .refine(
    (event) =>
      !(event.startsAt instanceof Date) ||
      !(event.endsAt instanceof Date) ||
      event.endsAt > event.startsAt,
    { path: ["endsAt"], message: "End time must be after start time." },
  );
export const idSchema = z.string().min(1).max(128);
export const revisionSchema = z
  .union([z.string().trim().min(1), z.number()])
  .transform((value) => Number(value))
  .pipe(z.number().int().min(0));
export const cancellationSchema = z
  .string()
  .trim()
  .min(5, "Give a cancellation reason of at least 5 characters.")
  .max(500);
