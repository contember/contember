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
				const params = new URLSearchParams({ backlink: window.location.pathname + window.location.search })
				window.location.href = '/?' + params.toString()
			}}
			routes={{
				projectList: { path: '/' },
				projectCreate: { path: '/project/create' },
				projectOverview: { path: '/project/view/:project' },
				userInvite: { path: '/project/invite/:project' },
				identityEdit: { path: '/project/edit/:project/:identity' },
				apiKeyCreate: { path: '/project/api-key/:project' },
				security: { path: '/security' },
				studioGrid: { path: '/project/studio/:project/grid/:entity/:id?' },
				studioForm: { path: '/project/studio/:project/form/:entity/:id?' },
			}}
			envVariables={config}
			children={<Pages layout={PanelLayout} children={import.meta.globEager('./pages/**/*.tsx')} />}
		/>
	)
}

runReactApp(<Entry />)
