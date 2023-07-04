import { ApplicationEntrypoint, PageModule, Pages, runReactApp } from '@contember/admin'
import { Directives, Slots } from '@contember/layout'
import { createRoot } from 'react-dom/client'
import { initialDirectives } from './components/Directives'
import { Layout, LayoutDevPanel, SafeAreasDevPanel, ThemeDevPanel } from './components/Layout'
import './index.css'

runReactApp(
	<Directives.Provider value={initialDirectives}>
		<Slots.Provider>
			<ApplicationEntrypoint
				apiBaseUrl={import.meta.env.VITE_CONTEMBER_ADMIN_API_BASE_URL as string}
				sessionToken={import.meta.env.VITE_CONTEMBER_ADMIN_SESSION_TOKEN as string}
				project={'admin-sandbox'}
				stage={'live'}
				basePath={import.meta.env.BASE_URL}
				devBarPanels={
					<>
						<LayoutDevPanel />
						<ThemeDevPanel />
						<SafeAreasDevPanel />
					</>
				}
				children={<Pages layout={Layout} children={import.meta.glob<PageModule>('./pages/**/*.tsx', { eager: true })} />}
			/>
		</Slots.Provider>
	</Directives.Provider>,
	null,
	(dom, react, onRecoverableError) => createRoot(dom, { onRecoverableError }).render(react),
)
