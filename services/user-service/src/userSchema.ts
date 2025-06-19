import { z } from 'zod';
// Validate incoming user payload
export const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional()
});
