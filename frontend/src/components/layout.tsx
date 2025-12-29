import type { ReactNode } from "react";
import { Navbar } from "./navbar";

interface LayoutProps {
	children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
	return (
		<div className="flex flex-col min-h-screen">
			<Navbar />
			<main className="container mx-auto px-4 py-8 flex-grow">{children}</main>
			<footer className="bg-gray-100 py-4 text-center text-sm text-gray-500">
				<p>© 2025 Blog. All rights reserved.</p>
			</footer>
		</div>
	);
}
