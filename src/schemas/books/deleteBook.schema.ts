import * as z from 'zod';

export const deleteBookSchema = z.object({
  params: z.object({
    bookId: z.string().uuid(),
  }),
  body: z.object({
    otp: z.string().length(6, "OTP must be 6 digits"),
  }),
});

export type DeleteBookInput = z.infer<typeof deleteBookSchema>;