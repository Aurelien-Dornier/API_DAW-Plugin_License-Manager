import { z } from "zod";

export const authSchema = {
  register: z.object({
    email: z.string().email(),
    password: z.string().min(20),
    firstname: z.string().optional(),
    lastname: z.string().optional(),
  }),

  login: z.object({
    email: z.string().email(),
    password: z.string(),
  }),

  verify2FA: z.object({
    token: z.string(),
  }),

  check2FAStatus: z.object({}),

} as const;
 