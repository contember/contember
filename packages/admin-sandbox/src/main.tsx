import { ApplicationEntrypoint, runReactApp } from '@contember/admin'
import Sandbox from './Sandbox'
import './index.sass'

runReactApp(
	<ApplicationEntrypoint
		apiBaseUrl={import.meta.env.VITE_CONTEMBER_ADMIN_API_BASE_URL as string}
		sessionToken={import.meta.env.VITE_CONTEMBER_ADMIN_SESSION_TOKEN as string}
		project={'admin-sandbox'}
		stage={'live'}
		routes={{
			dashboard: { path: '/' },
			second: { path: '/2nd' },
			fooPage: { path: '/foo' },
			barPage: { path: '/bar' },
			loremPage: { path: '/lorem' },
		}}
		children={<Sandbox />}
	/>,
)
