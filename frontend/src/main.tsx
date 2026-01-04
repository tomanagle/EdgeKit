import { AuthQueryProvider } from "@daveyplate/better-auth-tanstack";
import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import { QueryClientProvider } from "@tanstack/react-query";

import {
	createRouter,
	Link,
	RouterProvider,
	useRouter,
} from "@tanstack/react-router";

import { type ReactNode, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./global.css";
import { authClient } from "./lib/auth-client";
import { queryClient } from "./lib/query-client";
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({
	routeTree,
	context: {
		session: null,
		user: null,
	},
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const root = document.getElementById("root");
if (!root) {
	throw new Error("Root element not found");
}

export function Providers({ children }: { children: ReactNode }) {
	const router = useRouter();

	return (
		<QueryClientProvider client={queryClient}>
			<AuthQueryProvider>
				<AuthUIProvider
					authClient={authClient}
					navigate={(href) => router?.navigate({ href })}
					replace={(href) => router?.navigate({ href, replace: true })}
					Link={({ href, ...props }) => <Link to={href} {...props} />}
					social={{ providers: ["github"] }}
				>
					{children}
				</AuthUIProvider>
			</AuthQueryProvider>
		</QueryClientProvider>
	);
}

createRoot(root).render(
	<StrictMode>
		<Providers>
			<RouterProvider router={router} />
		</Providers>
	</StrictMode>,
);
