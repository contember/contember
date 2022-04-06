import { ApplicationEntrypoint, Pages, runReactApp } from '@contember/admin'
import { PanelLayout } from './components/PanelLayout'
import './index.sass'

runReactApp(
	<ApplicationEntrypoint
		apiBaseUrl={'/_api'}
		basePath={'/_panel/'}
		onInvalidIdentity={() => {
			window.location.href = '/'
		}}
		routes={{
			projectList: { path: '/' },
			projectCreate: { path: '/project/create' },
			projectOverview: { path: '/project/view/:project' },
			userInvite: { path: '/project/invite/:project' },
			identityEdit: { path: '/project/edit/:project/:identity' },
			apiKeyCreate: { path: '/project/api-key/:project' },
			security: { path: '/security' },
		}}
		children={<Pages layout={PanelLayout} children={import.meta.globEager('./pages/**/*.tsx')} />}
	/>,
)
