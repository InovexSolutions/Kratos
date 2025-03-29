import { createAuthClient } from "better-auth/vue"
import { adminClient } from "better-auth/client/plugins"
import { stripeClient } from "@better-auth/stripe/client"

export const authClient = createAuthClient({
    /** the base url of the server (optional if you're using the same domain) */
    baseURL: "http://localhost:3000",
	plugins: [
		adminClient(),
        stripeClient({
            subscription: true //if you want to enable subscription management
        })
    ]
})

export const {
    signIn,
	signOut,
	signUp,
	useSession,
	forgetPassword,
	resetPassword
} = authClient;