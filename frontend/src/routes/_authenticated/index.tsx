import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getPost, getPosts } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
export const Route = createFileRoute("/_authenticated/")({
	component: RouteComponent,
});

function RouteComponent() {
	const { data: postsData } = useQuery({
		queryKey: ["posts"],
		queryFn: getPosts,
	});

	const posts = postsData?.items ?? [];

	function prefetchPost(postId: string) {
		queryClient.prefetchQuery({
			queryKey: ["posts", postId],
			queryFn: () => getPost(postId),
		});
	}

	return (
		<div className="container mx-auto px-4">
			<div className="flex justify-end mb-4">
				<Button asChild>
					<Link to="/posts/new">New Post</Link>
				</Button>
			</div>

			<ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{posts.map((post) => {
					const createdAt = new Date(post.createdAt);
					return (
						<li key={post.id} onMouseEnter={() => prefetchPost(post.id)}>
							<Link
								to={`/posts/$postId`}
								params={{ postId: post.id }}
								className="block h-full"
							>
								<Card className="h-full">
									{post.image && (
										<img
											src={post.image}
											alt={post.title}
											className="w-full h-48 object-cover rounded-t-lg"
										/>
									)}
									<CardHeader>
										<CardTitle>{post.title}</CardTitle>
										<CardDescription>
											By {post.author.name} at {createdAt.toLocaleDateString()}
										</CardDescription>
									</CardHeader>
									<CardContent>
										<p className="line-clamp-3">{post.body}</p>
									</CardContent>
								</Card>
							</Link>
						</li>
					);
				})}
			</ol>
		</div>
	);
}
