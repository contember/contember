export const getConfig = () => {

	let project = import.meta.env.VITE_CONTEMBER_ADMIN_PROJECT_NAME
	if (project === '__PROJECT_SLUG__') {
		project = window.location.pathname.split('/')[1]
	}

	let basePath = import.meta.env.BASE_URL ?? '/'
	if (basePath === './') {
		basePath = `/${project}/`
	}
	const apiBaseUrl = import.meta.env.VITE_CONTEMBER_ADMIN_API_BASE_URL as string
	if (!apiBaseUrl) {
		throw new Error('VITE_CONTEMBER_ADMIN_API_BASE_URL is not set')
	}
	const sessionToken = import.meta.env.VITE_CONTEMBER_ADMIN_SESSION_TOKEN as string
	if (!sessionToken) {
		throw new Error('VITE_CONTEMBER_ADMIN_SESSION_TOKEN is not set')
	}

	return {
		project,
		sessionToken,
		basePath,
		apiBaseUrl,
		stage: 'live',
	}
}
