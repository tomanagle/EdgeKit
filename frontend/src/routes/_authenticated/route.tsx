import { Layout } from "@/components/layout";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<Layout>
			<Outlet />
		</Layout>
	);
}
