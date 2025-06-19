import { z } from 'zod';
// Validate incoming order payload
export const orderSchema = z.object({
  userId:   z.number().int().positive(),
  item:     z.string().min(1),
  quantity: z.number().int().positive()
});