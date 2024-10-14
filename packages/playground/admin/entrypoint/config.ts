import { ContemberClientProps } from '@contember/react-client'

export const entrypointConfig = (() => {
	const apiBaseUrl = import.meta.env.VITE_CONTEMBER_ADMIN_API_BASE_URL
	const loginToken = import.meta.env.VITE_CONTEMBER_ADMIN_LOGIN_TOKEN
	if (!apiBaseUrl) {
		throw new Error('VITE_CONTEMBER_ADMIN_API_BASE_URL is not set')
	}
	if (!loginToken) {
		throw new Error('VITE_CONTEMBER_ADMIN_LOGIN_TOKEN is not set')
	}
	return {
		clientConfig: {
			apiBaseUrl: apiBaseUrl,
			loginToken: loginToken,
		} satisfies ContemberClientProps,
		appUrl: '/app',
		hasTokenFromEnv: import.meta.env.VITE_CONTEMBER_ADMIN_SESSION_TOKEN !== '__SESSION_TOKEN__',
		idps: {
			google: 'Login with Google',
		} satisfies Record<string, string>,
		magicLink: true,
	}
})()

