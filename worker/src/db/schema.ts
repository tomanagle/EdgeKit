import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

export const postsSchema = sqliteTable("post", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	body: text("body").notNull(),
	image: text("image"),
	author: text("author")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const postsRelations = relations(postsSchema, ({ one }) => ({
	author: one(user, {
		fields: [postsSchema.author],
		references: [user.id],
	}),
}));

export const eventTypes = ["Post.Created", "Post.Viewed"] as const;
export type EventType = (typeof eventTypes)[number];

export const eventSchema = sqliteTable("event", {
	id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
	type: text("type").notNull().$type<(typeof eventTypes)[number]>(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
});
