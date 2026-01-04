import { hc } from "hono/client";
import type { AppRoutes } from "../../../worker/src/main";
import { VITE_API_BASE_URL } from "./config";

export const client = hc<AppRoutes>(VITE_API_BASE_URL, {
	init: {
		credentials: "include",
	},
});

export function createPost(body: {
	title: string;
	body: string;
	image?: string;
}) {
	return client.api.posts.$post({ json: body });
}

export async function getPosts() {
	const result = await client.api.posts.$get();

	if (!result.ok) {
		throw new Error("Failed to get posts");
	}
	return result.json();
}

export async function getPost(postId: string) {
	const result = await client.api.posts[":postId"].$get({
		param: { postId },
	});

	if (!result.ok) {
		throw new Error("Failed to get post");
	}
	return result.json();
}

export async function uploadFile(file: File) {
	const formData = new FormData();
	formData.append("file", file);

	const response = await fetch(`${VITE_API_BASE_URL}/api/upload`, {
		method: "POST",
		body: formData,
		credentials: "include",
	});

	if (!response.ok) {
		throw new Error("Failed to upload file");
	}

	return response.json() as Promise<{ key: string; publicUrl: string }>;
}
