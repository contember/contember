import { ApplicationEntrypoint, DataBindingProvider, FeedbackRenderer, PageModule, Pages, runReactApp } from '@contember/admin'
import { createRoot } from 'react-dom/client'
import { Layout } from './components/Layout'
import { MetaDirectivesProvider } from './components/MetaDirectives'
import './index.sass'

runReactApp(
	<ApplicationEntrypoint
		apiBaseUrl={import.meta.env.VITE_CONTEMBER_ADMIN_API_BASE_URL as string}
		sessionToken={import.meta.env.VITE_CONTEMBER_ADMIN_SESSION_TOKEN as string}
		project={'admin-sandbox'}
		stage={'live'}
		basePath={import.meta.env.BASE_URL}
		children={
			<DataBindingProvider stateComponent={FeedbackRenderer}>
				<MetaDirectivesProvider>
					<Layout>
						<Pages children={import.meta.glob<PageModule>('./pages/**/*.tsx')} />
					</Layout>
				</MetaDirectivesProvider>
			</DataBindingProvider>
		}
	/>,
	null,
	(dom, react, onRecoverableError) => createRoot(dom, { onRecoverableError }).render(react),
)
