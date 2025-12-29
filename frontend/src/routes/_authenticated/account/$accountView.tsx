import { AccountView } from "@daveyplate/better-auth-ui";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/account/$accountView")({
	component: RouteComponent,
});

function RouteComponent() {
	const { accountView } = Route.useParams();
	return <AccountView pathname={accountView} />;
}
