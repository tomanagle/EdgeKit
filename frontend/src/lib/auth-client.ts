import { createAuthClient } from "better-auth/react"
import { VITE_API_BASE_URL } from "./config"

export const authClient = createAuthClient({
    baseURL: `${VITE_API_BASE_URL}/api/auth`,
})