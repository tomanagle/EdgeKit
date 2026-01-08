import { relations, sql } from "drizzle-orm";
import { index, sqliteTable } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", t => ({
	id: t.text().primaryKey(),
	name: t.text().notNull(),
	email: t.text().notNull().unique(),
	emailVerified: t.integer({ mode: "boolean" })
		.default(false)
		.notNull(),
	image: t.text(),
	createdAt: t.integer({ mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: t.integer({ mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
}));

export const session = sqliteTable("session", t=> ({
		id: t.text().primaryKey(),
		expiresAt: t.integer({ mode: "timestamp_ms" }).notNull(),
		token: t.text().notNull().unique(),
		createdAt: t.integer({ mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: t.integer({ mode: "timestamp_ms" })
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		ipAddress: t.text(),
		userAgent: t.text(),
		userId: t.text()
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	}),
	(table) => [index("session_userId_idx").on(table.userId)],
);

export const account = sqliteTable("account", t=> ({
		id: t.text().primaryKey(),
		accountId: t.text().notNull(),
		providerId: t.text().notNull(),
		userId: t.text()
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: t.text(),
		refreshToken: t.text(),
		idToken: t.text(),
		accessTokenExpiresAt: t.integer({ mode: "timestamp_ms" }),
		refreshTokenExpiresAt: t.integer({ mode: "timestamp_ms" }),
		scope: t.text(),
		password: t.text(),
		createdAt: t.integer({ mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: t.integer({ mode: "timestamp_ms" })
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	}),
	(table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = sqliteTable("verification", t => ({
		id: t.text().primaryKey(),
		identifier: t.text().notNull(),
		value: t.text().notNull(),
		expiresAt: t.integer({ mode: "timestamp_ms" }).notNull(),
		createdAt: t.integer({ mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: t.integer({ mode: "timestamp_ms" })
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	}),
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));
