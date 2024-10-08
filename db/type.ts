import { z } from "zod";

export const UserSchema = z.object({
    name: z.string(),
    age: z.number(),
});

export type User = z.infer<typeof UserSchema>;

export const PersonSchema = z.object({
    name: z.string(),
    height: z.number(),
});

export type Person = z.infer<typeof PersonSchema>;
