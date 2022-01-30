import { ApplicationEntrypoint, Pages, runReactApp } from '@contember/admin'
import { Layout } from './components/Layout'
import './index.sass'

runReactApp(
	<ApplicationEntrypoint
		apiBaseUrl={import.meta.env.VITE_CONTEMBER_ADMIN_API_BASE_URL as string}
		sessionToken={import.meta.env.VITE_CONTEMBER_ADMIN_SESSION_TOKEN as string}
		project={'admin-sandbox'}
		stage={'live'}
		children={<Pages layout={Layout} children={import.meta.glob('./pages/*.tsx')} />}
	/>,
)
