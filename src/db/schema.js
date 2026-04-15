import {serial, text,timestamp,uuid, integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
        id: uuid("id").primaryKey().defaultRandom(),
        name: varchar("name",{ length: 255 }).notNull(),
        email: varchar("email",{ length: 255 }).notNull().unique(),
        phone_number : varchar("phone_number",{length : 20}).notNull().unique(),
        password : varchar("password",{length : 255}).notNull(),
        createdAt : timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const refreshTokens = pgTable("refresh_tokens",{
        id : serial("id").primaryKey(),
        userId : uuid("user_id").references(()=> users.id,{onDelete : "cascade", onUpdate : "cascade"}).notNull(),
        token : text("token").notNull().unique(),
        expiresAt : timestamp("expires_at",{withTimezone : true}).notNull(),
})
