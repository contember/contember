import * as React from 'react'
import { ApplicationEntrypoint, PageModule, Pages, runReactApp } from '@contember/admin'
import '@contember/admin/index.css'
import '@contember/layout/index.css'

import { Layout } from './components/Layout'
import { createRoot } from 'react-dom/client'
import { Directives, Slots } from '@contember/layout'
import { initialDirectives } from './components/Directives'

runReactApp(
	<Directives.Provider value={initialDirectives}>
		<Slots.Provider>
			<ApplicationEntrypoint
				basePath={import.meta.env.BASE_URL}
				apiBaseUrl={import.meta.env.VITE_CONTEMBER_ADMIN_API_BASE_URL}
				sessionToken={import.meta.env.VITE_CONTEMBER_ADMIN_SESSION_TOKEN}
				project={import.meta.env.VITE_CONTEMBER_ADMIN_PROJECT_NAME}
				stage="live"
				children={
					<Pages
						layout={Layout}
						children={import.meta.glob<PageModule>(
							'./pages/**/*.tsx',
							{ eager: true },
						)}
					/>
				}
			/>
		</Slots.Provider>
	</Directives.Provider>,
	null,
	(dom, react, onRecoverableError) => createRoot(dom, { onRecoverableError }).render(react),
)
