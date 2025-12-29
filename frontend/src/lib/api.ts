import { treaty } from "@elysiajs/eden";
import type { App } from "../../../worker/src/main.ts";
import { VITE_API_BASE_URL } from "./config";

const { api } = treaty<App>(VITE_API_BASE_URL, {
	fetch: {
		credentials: "include",
	},
});

export function createPost(post: Parameters<(typeof api.posts)["post"]>[0]) {
	return api.posts.post(post);
}

export function getPosts() {
	return api.posts.get();
}

export function getPost(postId: string) {
	return api
		.posts({
			postId,
		})
		.get();
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
