import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { Link, useRouteContext, useRouter } from "@tanstack/react-router";
import { LogOut, User } from "lucide-react";

export function Navbar() {
	const { session } = useRouteContext({ from: "__root__" });
	const router = useRouter();

	if (!session) {
		return null;
	}

	async function handleLogout() {
		await authClient.signOut();
		window.location.reload();
	}

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	return (
		<nav className="border-b bg-background">
			<div className="container mx-auto flex h-16 items-center justify-between px-4">
				<div className="flex items-center gap-2">
					<h1 className="text-xl font-semibold">
						<Link to="/" params={{ authView: "login" }}>
							EdgeKit
						</Link>
					</h1>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
						>
							<Avatar>
								<AvatarImage
									src={session.user.image ?? undefined}
									alt={session.user.name}
								/>
								<AvatarFallback>
									{getInitials(session.user.name)}
								</AvatarFallback>
							</Avatar>
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-56">
						<DropdownMenuLabel>
							<div className="flex flex-col space-y-1">
								<p className="text-sm font-medium leading-none">
									{session.user.name}
								</p>
								<p className="text-xs leading-none text-muted-foreground">
									{session.user.email}
								</p>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() =>
								router.navigate({
									to: "/account/$accountView",
									params: { accountView: "settings" },
								})
							}
						>
							<User className="mr-2 h-4 w-4" />
							<span>Account Settings</span>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={handleLogout}
							className="text-destructive"
						>
							<LogOut className="mr-2 h-4 w-4" />
							<span>Log out</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</nav>
	);
}
