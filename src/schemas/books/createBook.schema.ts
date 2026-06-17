import * as z from 'zod';

export const createBookSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Book name is required"),
        baseAmount: z.number().finite("Base amount must be a valid number"),
    }),
});

export type CreateBookInput = z.infer<typeof createBookSchema>["body"];