import { ProjectEntrypoint, runReactApp } from '@contember/admin'
import Sandbox from './Sandbox'
import './index.sass'

window.addEventListener('DOMContentLoaded', () => {
	const apiBaseUrl = import.meta.env.VITE_CONTEMBER_ADMIN_API_BASE_URL
	const sessionToken = import.meta.env.VITE_CONTEMBER_ADMIN_SESSION_TOKEN

	if (typeof apiBaseUrl !== 'string') {
		throw new Error(`The ENV variables haven't been set. Check your \`.env.development.local\` file.`) // TODO: better message
	}

	if (typeof sessionToken !== 'string') {
		throw new Error(`The ENV variables haven't been set. Check your \`.env.development.local\` file.`) // TODO: better message
	}

	runReactApp(
		<ProjectEntrypoint
			clientConfig={{ apiBaseUrl, sessionToken }}
			projectConfig={{
				project: 'sandbox',
				stage: 'live',
				component: <Sandbox />,
				routes: {
					dashboard: { path: '/' },
					second: { path: '/2nd' },
					fooPage: {path: '/foo'},
					barPage: {path: '/bar'},
					loremPage: {path: '/lorem'},
				},
			}}
		/>,
	)
})
