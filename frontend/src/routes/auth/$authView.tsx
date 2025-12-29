import { AuthView } from "@daveyplate/better-auth-ui";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/$authView")({
	component: RouteComponent,
});

function RouteComponent() {
	const { authView } = Route.useParams();

	return (
		<main className="flex justify-center items-center h-screen">
			<AuthView pathname={authView} />
		</main>
	);
}
