import { ApplicationEntrypoint, Pages, runReactApp } from '@contember/admin'
import '@contember/admin/style.css'
import * as React from 'react'
import { Layout } from './components/Layout'

const pages = Object.values(import.meta.globEager('./pages/*.tsx')).flatMap(Object.values)

runReactApp(
	<ApplicationEntrypoint
		basePath={import.meta.env.BASE_URL}
		apiBaseUrl={import.meta.env.VITE_CONTEMBER_ADMIN_API_BASE_URL}
		sessionToken={import.meta.env.VITE_CONTEMBER_ADMIN_SESSION_TOKEN}
		project={import.meta.env.VITE_CONTEMBER_ADMIN_PROJECT_NAME}
		stage="live"
		routes={{ dashboard: { path: '/' } }}
		children={<Pages layout={Layout} children={pages} />}
	/>,
)
