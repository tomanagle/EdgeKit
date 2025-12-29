import { type Static, t } from "elysia";

export const createPostBodySchema = t.Object({
	title: t.String(),
	body: t.String(),
	image: t.Optional(t.String()),
});

export type CreatePostBody = Static<typeof createPostBodySchema>;

export const postResponseSchema = t.Object({
	id: t.String(),
	title: t.String(),
	body: t.String(),
	image: t.Nullable(t.String()),
	createdAt: t.String(),
	updatedAt: t.String(),
	author: t.Object({
		id: t.String(),
		name: t.String(),
	}),
});

export type PostResponse = Static<typeof postResponseSchema>;

export const getPostsResponseSchema = t.Object({
	items: t.Array(postResponseSchema),
});

export type GetPostsResponse = Static<typeof getPostsResponseSchema>;

export type GetPostResponse = Static<typeof postResponseSchema>;
