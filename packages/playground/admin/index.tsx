import { ApplicationEntrypoint, PageModule, Pages, runReactApp } from '@contember/interface'
import { SlotsProvider } from '@contember/react-slots'
import { Layout } from './src/components/layout'
import './index.css'
import { Toaster } from './src/components/ui/toast'

runReactApp(
	<SlotsProvider>
		<ApplicationEntrypoint
			apiBaseUrl={import.meta.env.VITE_CONTEMBER_ADMIN_API_BASE_URL as string}
			sessionToken={import.meta.env.VITE_CONTEMBER_ADMIN_SESSION_TOKEN as string}
			project={'playground'}
			stage={'live'}
			basePath={import.meta.env.BASE_URL}
			devBarPanels={
				<>
				</>
			}
			children={
				<Toaster>
					<Pages
						layout={Layout}
						children={import.meta.glob<PageModule>(
							'./src/pages/**/*.tsx',
							{ eager: true },
						)}
					/>
				</Toaster>
			}
		/>
	</SlotsProvider>
	,
)
