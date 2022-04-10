import { ApplicationEntrypoint, Pages, runReactApp } from '@contember/admin'
import { PanelLayout } from './components/PanelLayout'
import './index.sass'
import { panelConfig } from '../../src/config'

const Entry = () => {
	const configElement = document.getElementById('contember-config')
	const config = panelConfig(JSON.parse(configElement?.innerHTML ?? '{}'))

	return (
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
			envVariables={config}
			children={<Pages layout={PanelLayout} children={import.meta.globEager('./pages/**/*.tsx')} />}
		/>
	)
}

runReactApp(<Entry />)
