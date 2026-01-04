export async function uploadFile({
	file,
	userId,
	env,
}: {
	file: File;
	userId: string;
	env: Env;
}): Promise<{ key: string; publicUrl: string }> {
	// Generate a unique key for the file
	const extension = file.name.split(".").pop() || "";
	const key = `posts/${userId}/${crypto.randomUUID()}.${extension}`;

	// Stream the file directly to R2
	await env.BUCKET.put(key, file.stream(), {
		httpMetadata: {
			contentType: file.type,
		},
	});

	// Construct public URL using the backend URL
	// Use request URL if available, otherwise use FRONTEND_URL (assuming same origin)
	const baseUrl = env.FRONTEND_URL;

	console.log("baseUrl", baseUrl);

	// Encode the key for URL - slashes need to be encoded
	// We encode the entire key so slashes become %2F
	const encodedKey = encodeURIComponent(key);
	const publicUrl = `${baseUrl}/api/files/${encodedKey}`;

	return {
		key,
		publicUrl,
	};
}

export async function getFile({
	key,
	env,
}: {
	key: string;
	env: Env;
}): Promise<Response | null> {
	const object = await env.BUCKET.get(key);

	if (!object) {
		return null;
	}

	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set("etag", object.httpEtag);

	return new Response(object.body, {
		headers,
	});
}
