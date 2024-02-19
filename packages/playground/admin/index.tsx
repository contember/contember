import { ApplicationEntrypoint, PageModule, Pages, runReactApp } from '@contember/interface'
import { SlotsProvider } from '@contember/react-slots'
import { Layout } from './app/components/layout'
import './index.css'
import { Toaster } from './lib/components/ui/toast'
import { DevBar, DevPanel } from '@contember/react-devbar'
import { LogInIcon } from 'lucide-react'
import { LoginWithEmail } from './lib/components/dev/login-panel'

if (!import.meta.env.VITE_CONTEMBER_ADMIN_API_BASE_URL) {
	throw new Error('VITE_CONTEMBER_ADMIN_API_BASE_URL is not set')
}

let projectSlug = import.meta.env.VITE_CONTEMBER_ADMIN_PROJECT_NAME
if (projectSlug === '__PROJECT_SLUG__') {
	projectSlug = window.location.pathname.split('/')[1]
}

let basePath = import.meta.env.BASE_URL ?? '/'
if (basePath === './') {
	basePath = `/${projectSlug}/`
}

runReactApp(
	<SlotsProvider>
		<ApplicationEntrypoint
			apiBaseUrl={import.meta.env.VITE_CONTEMBER_ADMIN_API_BASE_URL as string}
			sessionToken={import.meta.env.VITE_CONTEMBER_ADMIN_SESSION_TOKEN as string}
			project={'playground'}
			stage={'live'}
			basePath={import.meta.env.BASE_URL}
			children={
				<>
					<Toaster>
						<Pages
							layout={Layout}
							children={import.meta.glob<PageModule>(
								'./app/pages/**/*.tsx',
								{ eager: true },
							)}
						/>
						<DevBar>
							<DevPanel heading="Login" icon={<LogInIcon />}><LoginWithEmail /></DevPanel>
						</DevBar>
					</Toaster>
				</>
			}
		/>
	</SlotsProvider>
	,
)
