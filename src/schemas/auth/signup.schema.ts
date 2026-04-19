import * as z from 'zod';

export const signupSchema = z.object({
        body : z.object({
                email : z.string().email(),
                password : z.string().min(8,"Password has to be minimum 8 character long")
                        .max(100, "Password is too long")
                        .regex(/[A-Z]/, "Must contain one uppercase letter")
                        .regex(/[a-z]/, "Must contain one lowercase letter")
                        .regex(/[0-9]/, "Must contain one number"),
                name : z.string()
                        .trim()
                        .min(1,"Name can't be empty")
                        .max(100,"Name too long"),
                phone_number : z.string()
                                .trim()
                                .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format (E.164)")
        })
})


