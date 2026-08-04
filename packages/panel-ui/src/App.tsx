import { IdentityProvider, IdentityState } from '@contember/react-client-tenant'
import { IdentityEnvironmentProvider } from '@contember/react-identity'
import { RoutingProvider } from '@contember/react-routing'
import { SlotsProvider } from '@contember/react-slots'
import { Button, Toaster } from '@contember/react-ui-lib-base'
import { useCallback, useState } from 'react'
import type { PanelRuntimeConfig } from './config.js'
import { panelRegistry } from './modules/index.js'
import { AccessDeniedScreen } from './shell/AccessDeniedScreen.js'
import { LoginScreen } from './shell/LoginScreen.js'
import { PanelClient } from './shell/PanelClient.js'
import { PanelLayout } from './shell/PanelLayout.js'
import { PanelRouter } from './shell/PanelRouter.js'
import { CenteredScreen, FullScreenLoader, MessageCard } from './shell/screens.js'
import { useSignOut } from './shell/signOut.js'

const IdentityFailed = () => {
	const signOut = useSignOut()
	return (
		<CenteredScreen>
			<MessageCard title="Cannot load your identity" description="The panel could not reach the tenant API.">
				<Button className="w-full" onClick={signOut}>Sign in again</Button>
			</MessageCard>
		</CenteredScreen>
	)
}

/** A panel denial wins over every other state — see `isPanelAccessDenied`. */
const PanelGate = ({ accessDenied }: { accessDenied: boolean }) => {
	if (accessDenied) {
		return <AccessDeniedScreen />
	}
	return (
		<>
			<IdentityState state="loading">
				<FullScreenLoader />
			</IdentityState>
			<IdentityState state={['none', 'cleared']}>
				<LoginScreen />
			</IdentityState>
			<IdentityState state="failed">
				<IdentityFailed />
			</IdentityState>
			<IdentityState state="success">
				<PanelLayout>
					<PanelRouter />
				</PanelLayout>
			</IdentityState>
		</>
	)
}

export const App = ({ config }: { config: PanelRuntimeConfig }) => {
	const [accessDenied, setAccessDenied] = useState(false)
	const onAccessDenied = useCallback(() => setAccessDenied(true), [])

	return (
		<PanelClient apiBaseUrl={config.apiBaseUrl} onAccessDenied={onAccessDenied}>
			<RoutingProvider basePath={config.basePath} routes={panelRegistry.routes}>
				<IdentityProvider>
					<IdentityEnvironmentProvider>
						<SlotsProvider>
							<Toaster>
								<PanelGate accessDenied={accessDenied} />
							</Toaster>
						</SlotsProvider>
					</IdentityEnvironmentProvider>
				</IdentityProvider>
			</RoutingProvider>
		</PanelClient>
	)
}
