import { z } from "zod";
const short = z.string().trim().max(200);
const long = z.string().trim().max(20000);
export const shotSchema = z.object({
  id: z.uuid(),
  path: z.string().max(500),
  alt: short,
  caption: z.string().max(500),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  reviewed: z.boolean(),
});
export const postSchema = z
  .object({
    id: z.uuid().optional(),
    title: short.min(5),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(180),
    excerpt: z.string().max(400),
    device: short,
    manufacturer: short,
    os: short,
    category: short.min(1),
    tags: z.array(short).max(20),
    symptoms: long,
    error_message: long,
    cause: long,
    steps: long,
    commands: long,
    warnings: long,
    verification: long,
    alternatives: long,
    faq: z.array(z.object({ question: short, answer: long })).max(20),
    related_ids: z.array(z.uuid()).max(10),
    screenshots: z.array(shotSchema).max(20),
    seo_title: z.string().max(100),
    seo_description: z.string().max(180),
    status: z.enum([
      "draft",
      "review",
      "needs_verification",
      "published",
      "archived",
    ]),
    verified: z.boolean(),
    published_at: z.preprocess(
      (value) => (value === "" ? null : value),
      z.iso
        .datetime({ offset: true })
        .transform((value) => new Date(value).toISOString())
        .nullable(),
    ),
    // Keep database precision for optimistic concurrency comparisons.
    expected_updated_at: z.iso.datetime({ offset: true }).optional(),
  })
  .superRefine((p, c) => {
    if (p.status !== "published") return;
    const issue = (path: (string | number)[], message: string) =>
      c.addIssue({ code: "custom", path, message });
    if (!p.verified)
      issue(
        ["verified"],
        "Review the technical guidance against references before publishing. This does not confirm a shop repair outcome.",
      );
    if (p.steps.length < 20)
      issue(
        ["steps"],
        "Add solution steps (at least 20 characters) before publishing.",
      );
    if (p.verification.length < 10)
      issue(
        ["verification"],
        "Describe the result checks or recorded evidence (at least 10 characters).",
      );
    if (!p.excerpt.trim())
      issue(["excerpt"], "Add a quick answer before publishing.");
    p.screenshots.forEach((shot, i) => {
      if (!shot.reviewed)
        issue(
          ["screenshots", i, "reviewed"],
          "Inspect this image and remove private information before publishing.",
        );
      if (shot.alt.length < 3)
        issue(
          ["screenshots", i, "alt"],
          "Describe this image in at least 3 characters before publishing.",
        );
    });
  });
export const commentSchema = z.object({
  post_id: z.uuid(),
  name: short.min(2).max(80),
  body: z.string().trim().min(3).max(3000),
  website: z.string().max(0).optional(),
  token: z.string().max(3000).optional(),
});
export const requestSchema = z.object({
  title: short.min(5),
  description: z.string().trim().min(20).max(10000),
  device: short,
  os: short,
  error_message: z.string().max(2000),
  tried: z.string().max(5000),
  contact: z
    .string()
    .trim()
    .max(254)
    .refine(
      (s) => !s || z.email().safeParse(s).success,
      "Use an email address",
    ),
  consent: z.literal(true),
  website: z.string().max(0).optional(),
  token: z.string().max(3000).optional(),
});
export function safeUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}
export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180);
}
