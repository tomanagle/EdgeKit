import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Layout } from "@/components/layout";

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
