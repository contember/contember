import { ContemberClientProps } from '@contember/react-client'

/**
 * Configuration for the login entrypoint.
 * Loads environment variables and prepares configuration for the Contember client.
*/
export const loginEntrypointConfig = (() => {
	const apiBaseUrl = import.meta.env.VITE_CONTEMBER_ADMIN_API_BASE_URL
	const loginToken = import.meta.env.VITE_CONTEMBER_ADMIN_LOGIN_TOKEN

	if (!apiBaseUrl) {
		throw new Error('VITE_CONTEMBER_ADMIN_API_BASE_URL is not set')
	}
	if (!loginToken) {
		throw new Error('VITE_CONTEMBER_ADMIN_LOGIN_TOKEN is not set')
	}

	const clientConfig = {
		apiBaseUrl,
		loginToken,
	} satisfies ContemberClientProps

	// You can add more IDPs here
	const identityProviders = {
		// 	google: 'Login with Google',
	} satisfies Record<string, string>

	return {
		...clientConfig,
		idps: identityProviders,
		appUrl: '/app',
		hasTokenFromEnv: import.meta.env.VITE_CONTEMBER_ADMIN_SESSION_TOKEN !== '__SESSION_TOKEN__',
		magicLink: true,
	}
})()
