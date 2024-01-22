import { ApplicationEntrypoint, PageModule, Pages, runReactApp } from '@contember/interface'
import { SlotsProvider } from '@contember/react-slots'
import { Layout } from './src/components/Layout'
import './index.css'

runReactApp(
		<SlotsProvider>
			<ApplicationEntrypoint
				apiBaseUrl={import.meta.env.VITE_CONTEMBER_ADMIN_API_BASE_URL as string}
				sessionToken={import.meta.env.VITE_CONTEMBER_ADMIN_SESSION_TOKEN as string}
				project={'admin-sandbox'}
				stage={'live'}
				basePath={import.meta.env.BASE_URL}
				devBarPanels={
					<>
					</>
				}
				children={<Pages
					layout={Layout}
					children={import.meta.glob<PageModule>(
						'./src/pages/**/*.tsx',
						{ eager: true },
					)}
				/>}
			/>
		</SlotsProvider>
	,
)
