import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	redirect,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { Session, User } from "better-auth";
import { ENABLE_QUERY_DEVTOOLS, ENABLE_ROUTER_DEVTOOLS } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { authClient } from "../lib/auth-client";

interface RouterContext {
	session: Session | null;
	user: User | null;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "EdgeKit",
			},
		],
		links: [
			{ rel: "icon", href: "/favicon.ico" },
			{ rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
			{ rel: "manifest", href: "/manifest.webmanifest" },
		],
	}),
	beforeLoad: async ({ location }) => {
		const { data } = await queryClient.ensureQueryData({
			queryKey: ["session"],
			queryFn: () => authClient.getSession({}),
		});

		if (!data) {
			// Don't redirect if already on an auth path
			if (!location.pathname.includes("/auth")) {
				const redirectTo = encodeURIComponent(location.pathname);
				const loginUrl = `/auth/login?redirectTo=${redirectTo}`;
				throw redirect({
					href: loginUrl,
				});
			}
			return {
				session: null,
				user: null,
			};
		}

		if (location.pathname.includes("/auth") && data.user) {
			throw redirect({
				href: "/",
			});
		}

		return {
			session: data,
			user: data.user,
		};
	},
	component: RootComponent,
});

function RootComponent() {
	return (
		<>
			<HeadContent />
			<Outlet />
			{ENABLE_QUERY_DEVTOOLS && <ReactQueryDevtools initialIsOpen={false} />}
			{ENABLE_ROUTER_DEVTOOLS && <TanStackRouterDevtools />}
			<TanStackRouterDevtools />
		</>
	);
}
