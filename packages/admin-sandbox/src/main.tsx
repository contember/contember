import { runAdmin } from '@contember/admin'
import './index.sass'
import Sandbox from './Sandbox'

window.addEventListener('DOMContentLoaded', () => {
	const apiBaseUrl = import.meta.env.VITE_CONTEMBER_ADMIN_API_BASE_URL
	const loginToken = import.meta.env.VITE_CONTEMBER_ADMIN_LOGIN_TOKEN

	if (typeof apiBaseUrl !== 'string' || typeof loginToken !== 'string') {
		throw new Error(`The ENV variables haven't been set. Check your \`.env.development.local\` file.`)
	}

	runAdmin(
		{
			sandbox: {
				project: 'sandbox',
				stage: 'live',
				component: <Sandbox />,
				routes: {
					dashboard: { path: '/' },
				},
			},
		},
		{
			config: {
				apiBaseUrl,
				loginToken,
			},
		},
	)
})
