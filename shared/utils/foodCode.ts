import { z } from "zod";

/** A BLS code is a letter and six characters (C214200, Q6A4000); own codes look like H_000001. */
export const foodCode = z.string().regex(/^[A-Z][A-Z0-9_]{6,7}$/);
