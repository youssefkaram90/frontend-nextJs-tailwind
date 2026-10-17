import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  lastName: z.string().optional(),
  role: z.enum(["ADMIN", "MANAGER", "USER"], {
    message: "Role is required",
  }),
});

export type SignupFormData = z.input<typeof signupSchema>;
