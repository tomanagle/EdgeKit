import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { getPost } from "@/lib/api";
import { queryClient } from "@/lib/query-client";

export const Route = createFileRoute("/_authenticated/posts/$postId")({
	component: RouteComponent,
	beforeLoad: async ({ params: { postId } }) => {
		const data = await queryClient.ensureQueryData({
			queryKey: ["posts", postId],
			queryFn: () => getPost(postId),
		});
		return { post: data };
	},
	loader({ context }) {
		return { post: context.post };
	},
	head: ({ loaderData }) => {
		return {
			meta: [
				{
					title: loaderData?.post?.title,
				},
			],
		};
	},
});

function RouteComponent() {
	const { post } = Route.useRouteContext();

	if (!post) {
		return <div>Post not found</div>;
	}

	const createdAt = new Date(post.createdAt);

	return (
		<>
			<Link to="/">
				<ArrowLeftIcon className="w-4 h-4" />
			</Link>

			<div className="mt-4">
				<article>
					<header className="bg-gray-100 pb-4 mb-4 rounded-lg border-2 border-gray-200">
						{post.image && (
							<img
								src={post.image}
								alt={post.title}
								className="w-full h-48 object-cover rounded-t-lg mb-4"
							/>
						)}
						<div className="px-4 max-w-2xl mx-auto">
							<h1 className="text-2xl font-bold">{post.title}</h1>
							<p className="text-sm text-gray-500 italic my-2">
								Published by {post.author.name} at{" "}
								<time
									dateTime={createdAt.toLocaleDateString()}
									className="text-sm text-gray-500"
								>
									{createdAt.toLocaleDateString()}
								</time>
							</p>
						</div>
					</header>
					<div className="px-4 max-w-2xl mx-auto">
						<p>{post?.body}</p>
					</div>
				</article>
			</div>
		</>
	);
}
