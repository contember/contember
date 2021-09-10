import { ApplicationEntrypoint, Layout, Pages, runReactApp } from '@contember/admin'
import { SideMenu } from './SideMenu'
import { ReactNode } from 'react'
import '@contember/admin/style.css'

const pages = Object.values(import.meta.globEager('./pages/*.tsx')).flatMap(
	Object.values,
)

const CustomLayout = (props: { children?: ReactNode }) => (
	<Layout topStart="{projectName}" sideBar={<SideMenu />} children={props.children} />
)

runReactApp(
	<ApplicationEntrypoint
		basePath={import.meta.env.BASE_URL}
		sessionToken={import.meta.env.VITE_CONTEMBER_ADMIN_SESSION_TOKEN as string}
		apiBaseUrl={import.meta.env.VITE_CONTEMBER_ADMIN_API_BASE_URL as string}
		envVariables={{
			// EXAMPLE_ENV_VARIABLE: import.meta.env.VITE_CONTEMBER_ADMIN_EXAMPLE_ENV_VARIABLE as string,
		}}
		project={import.meta.env.VITE_CONTEMBER_ADMIN_PROJECT_NAME as string}
		stage="live"
		routes={{ dashboard: { path: '/' } }}
	>
		<Pages layout={CustomLayout} children={pages} />
	</ApplicationEntrypoint>,
)
