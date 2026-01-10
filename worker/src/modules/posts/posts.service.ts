import { db } from "../../db";
import { eventSchema, postsSchema } from "../../db/schema";
import type {
  CreatePostBody,
  GetPostResponse,
  GetPostsResponse,
  PostResponse,
} from "./posts.schema";

export async function createPostHandler(
	{
		body,
		userId,
	}: {
		body: CreatePostBody;
		userId: string;
	}
): Promise<PostResponse> {
	const id = crypto.randomUUID();
	await db.batch([
		db
			.insert(postsSchema)
			.values({
				...body,
				id,
				author: userId,
				image: body.image || null,
			})
			.returning(),
		db.insert(eventSchema).values({
			type: "Post.Created",
			userId,
		}),
	]);

	const post = await db.query.postsSchema.findFirst({
		where: (postsSchema, { eq }) => eq(postsSchema.id, id),
		with: {
			author: {
				columns: {
					id: true,
					name: true,
				},
			},
		},
	});

	if (!post) {
		throw new Error("Failed to create post");
	}

	return {
		id: post.id,
		title: post.title,
		body: post.body,
		image: post.image || null,
		createdAt: post.createdAt.toISOString(),
		updatedAt: post.updatedAt.toISOString(),
		author: {
			id: post.author.id,
			name: post.author.name,
		},
	};
}

export async function getPostsHandler(): Promise<GetPostsResponse> {
	const posts = await db.query.postsSchema.findMany({
		orderBy: (postsSchema, { desc }) => [desc(postsSchema.createdAt)],
		with: {
			author: {
				columns: {
					id: true,
					name: true,
				},
			},
		},
	});

	return {
		items: posts.map((post) => ({
			id: post.id,
			title: post.title,
			body: post.body,
			image: post.image || null,
			createdAt: post.createdAt.toISOString(),
			updatedAt: post.updatedAt.toISOString(),
			author: {
				id: post.author.id,
				name: post.author.name,
			},
		})),
	};
}

export async function getPostHandler(
	{
		postId,
		userId,
	}: {
		userId: string;
		postId: string;
	},
): Promise<GetPostResponse> {
	const post = await db.query.postsSchema.findFirst({
		where: (postsSchema, { eq }) => eq(postsSchema.id, postId),
		with: {
			author: {
				columns: {
					id: true,
					name: true,
				},
			},
		},
	});
	if (!post) {
		throw new Error("Post not found");
	}

	await db.insert(eventSchema).values({
		type: "Post.Viewed",
		userId,
	});

	return {
		id: post.id,
		title: post.title,
		body: post.body,
		image: post.image || null,
		createdAt: post.createdAt.toISOString(),
		updatedAt: post.updatedAt.toISOString(),
		author: {
			id: post.author.id,
			name: post.author.name,
		},
	};
}
