import { z } from "zod";

export const createPostBodySchema = z.object({
	title: z.string(),
	body: z.string(),
	image: z.string().optional(),
});

export type CreatePostBody = z.infer<typeof createPostBodySchema>;

export const postResponseSchema = z.object({
	id: z.string(),
	title: z.string(),
	body: z.string(),
	image: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
	author: z.object({
		id: z.string(),
		name: z.string(),
	}),
});

export type PostResponse = z.infer<typeof postResponseSchema>;

export const getPostsResponseSchema = z.object({
	items: z.array(postResponseSchema),
});

export type GetPostsResponse = z.infer<typeof getPostsResponseSchema>;

export type GetPostResponse = z.infer<typeof postResponseSchema>;
