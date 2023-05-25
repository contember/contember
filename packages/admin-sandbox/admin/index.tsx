import { ApplicationEntrypoint, PageModule, Pages, runReactApp } from '@contember/admin'
import { LayoutSlotsProvider } from '@contember/layout'
import { createRoot } from 'react-dom/client'
import { DirectivesProvider } from './components/Directives'
import { Layout, LayoutDevPanel } from './components/Layout'
import './index.css'

runReactApp(
	<DirectivesProvider>
		<ApplicationEntrypoint
			apiBaseUrl={import.meta.env.VITE_CONTEMBER_ADMIN_API_BASE_URL as string}
			sessionToken={import.meta.env.VITE_CONTEMBER_ADMIN_SESSION_TOKEN as string}
			project={'admin-sandbox'}
			stage={'live'}
			basePath={import.meta.env.BASE_URL}
			devBarPanels={<>
				<LayoutDevPanel />
			</>}
			children={
				<LayoutSlotsProvider>
					<Pages children={import.meta.glob<PageModule>('./pages/**/*.tsx')} layout={Layout} />
				</LayoutSlotsProvider>
			}
		/>
	</DirectivesProvider>,
	null,
	(dom, react, onRecoverableError) => createRoot(dom, { onRecoverableError }).render(react),
)
