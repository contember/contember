import { ContemberClient, ContemberClientProps } from '@contember/react-client'
import { type PageModule, Pages, RoutingProvider } from '@contember/react-routing'
import { Toaster } from '~/lib/toast/toast'
import { Layout } from './components/layout'
import { type LoginConfig, LoginConfigProvider } from './contexts/login'

export type LoginEntrypointProps = ContemberClientProps & LoginConfig

export const LoginEntrypoint = ({ appUrl, hasTokenFromEnv, idps, magicLink, apiBaseUrl, sessionToken, loginToken, project, stage }: LoginEntrypointProps) => (
	<ContemberClient apiBaseUrl={apiBaseUrl} sessionToken={sessionToken} loginToken={loginToken} project={project} stage={stage}>
		<LoginConfigProvider appUrl={appUrl} hasTokenFromEnv={hasTokenFromEnv} idps={idps} magicLink={magicLink}>
			<RoutingProvider pageInQuery>
				<Toaster>
					<Pages
						layout={Layout}
						children={import.meta.glob<PageModule>(
							'./pages/**/*.tsx',
							{ eager: true }
						)} />
				</Toaster>
			</RoutingProvider>
		</LoginConfigProvider>
	</ContemberClient>
)
