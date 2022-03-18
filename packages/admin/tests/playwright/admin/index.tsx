import { ApplicationEntrypoint, Pages, runReactApp } from '../../../src'
import '../../../dist/style.css'

const projectSlug = window.location.pathname.split('/')[1]

runReactApp(
	<ApplicationEntrypoint
		apiBaseUrl={import.meta.env.VITE_CONTEMBER_ADMIN_API_BASE_URL as string}
		sessionToken={import.meta.env.VITE_CONTEMBER_ADMIN_SESSION_TOKEN as string}
		project={projectSlug}
		stage={'live'}
		basePath={'/' + projectSlug + '/'}
		children={<Pages children={import.meta.glob('../cases/**/*.tsx')} />}
	/>,
)
