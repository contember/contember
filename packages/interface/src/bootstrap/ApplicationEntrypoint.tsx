import { Environment, EnvironmentContext, EnvironmentExtensionProvider } from '@contember/react-binding'
import { ContemberClient, ContemberClientProps } from '@contember/react-client'
import { ReactNode } from 'react'
import { RequestProvider, RouteMap, RoutingContext, RoutingContextValue, SelectedDimension } from '@contember/react-routing'
import { DataViewPageNameKeyProvider } from './DataViewPageNameKeyProvider'
import { IdentityProvider, projectEnvironmentExtension } from '@contember/react-identity'

export interface ApplicationEntrypointProps extends ContemberClientProps {
	basePath: string
	sessionToken?: string
	routes?: RouteMap
	children: ReactNode
	environment?: Environment
}

const validateProps = (props: Partial<ApplicationEntrypointProps>) => {
	if (typeof props.apiBaseUrl !== 'string') {
		throw new Error(`The ENV variables haven't been set. Check your \`.env.development.local\` file.`) // TODO: better message
	}
}

/**
 * @group Entrypoints
 */
export const ApplicationEntrypoint = (props: ApplicationEntrypointProps) => {
	validateProps(props)

	const rootEnv = props.environment ?? Environment.create()

	const routing: RoutingContextValue = {
		basePath: props.basePath,
		routes: props.routes ?? { index: { path: '/' } },
		defaultDimensions: rootEnv.getAllDimensions(),
	}


	return (
		<EnvironmentContext.Provider value={rootEnv}>
			<RoutingContext.Provider value={routing}>
				<RequestProvider>
					<ContemberClient
						apiBaseUrl={props.apiBaseUrl}
						sessionToken={props.sessionToken}
						loginToken={props.loginToken}
						project={props.project}
						stage={props.stage}
					>
						<EnvironmentExtensionProvider extension={projectEnvironmentExtension} state={props.project ?? null}>
							<DataViewPageNameKeyProvider>
								<IdentityProvider>
									{props.children}
								</IdentityProvider>
							</DataViewPageNameKeyProvider>
						</EnvironmentExtensionProvider>
					</ContemberClient>
				</RequestProvider>
			</RoutingContext.Provider>
		</EnvironmentContext.Provider>
	)
}
