export const VITE_API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL ?? window.location.origin;
export const VITE_FRONTEND_URL =
	import.meta.env.VITE_FRONTEND_URL ?? window.location.origin;

export const IS_DEV =
	window.location.origin.includes("localhost") || import.meta.env.DEV;

export const ENABLE_QUERY_DEVTOOLS = import.meta.env.DEV;
export const ENABLE_ROUTER_DEVTOOLS = import.meta.env.DEV;
