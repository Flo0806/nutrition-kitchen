import { z } from "zod";

export const feedbackKinds = ["missingFood", "wrongValue", "bug", "idea"] as const;
export type FeedbackKind = (typeof feedbackKinds)[number];

export const feedbackMessage = z.string().trim().min(3).max(2000);

/** What a report carries; the same rules in the form and on the server. */
export const feedbackInput = z.object({
  kind: z.enum(feedbackKinds),
  message: feedbackMessage,
  // Only to answer; empty means no answer wanted.
  email: z.union([z.literal(""), z.string().trim().email().max(200)]).default(""),
  // The search that found nothing, when the report starts there.
  search: z.string().trim().max(120).default(""),
  altcha: z.string().min(1).max(10_000),
  // A field people never see: a bot that fills it is thanked and ignored.
  website: z.string().max(200).default(""),
});

export type FeedbackInput = z.infer<typeof feedbackInput>;
