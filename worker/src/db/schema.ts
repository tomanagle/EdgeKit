import { relations, sql } from "drizzle-orm";
import { sqliteTable } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

export const postsSchema = sqliteTable("post", (t) => ({
	id: t.text().primaryKey(),
	title: t.text().notNull(),
	body: t.text().notNull(),
	image: t.text(),
	author: t
		.text()
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	createdAt: t
		.integer({ mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: t
		.integer({ mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
}));

export const postsRelations = relations(postsSchema, ({ one }) => ({
	author: one(user, {
		fields: [postsSchema.author],
		references: [user.id],
	}),
}));

export const eventTypes = ["Post.Created", "Post.Viewed"] as const;
export type EventType = (typeof eventTypes)[number];

export const eventSchema = sqliteTable("event", (t) => ({
	id: t.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
	type: t.text().notNull().$type<(typeof eventTypes)[number]>(),
	userId: t
		.text()
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	createdAt: t
		.integer({ mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
}));
