"use client";

import { z } from "zod";

export const loginSchema = z.object({
  companySlug: z.string().min(1, "Company slug is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
