import { Environment, EnvironmentContext, EnvironmentExtensionProvider } from '@contember/react-binding'
import { ContemberClient, ContemberClientProps } from '@contember/react-client'
import { ReactNode } from 'react'
import { RequestProvider, RouteMap, RoutingContext, RoutingContextValue, SelectedDimension } from '@contember/react-routing'
import { DataViewPageNameKeyProvider } from './DataViewPageNameKeyProvider'
import { IdentityProvider, projectEnvironmentExtension } from '@contember/react-identity'

export interface ApplicationEntrypointProps extends ContemberClientProps {
	basePath?: string
	sessionToken?: string
	routes?: RouteMap
	defaultDimensions?: SelectedDimension
	defaultLocale?: string
	envVariables?: Record<string, string>
	children: ReactNode
	devBarPanels?: ReactNode
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
	const projectSlug = props.project === '__PROJECT_SLUG__'
		? window.location.pathname.split('/')[1]
		: props.project
	const basePath = props.basePath === './'
		? `/${projectSlug}/`
		: (props.basePath ?? '/')

	const routing: RoutingContextValue = {
		basePath,
		routes: props.routes ?? { index: { path: '/' } },
		defaultDimensions: props.defaultDimensions,
	}

	const rootEnv = Environment.create()
		.withVariables(props.envVariables)
		.withDimensions(props.defaultDimensions ?? {})

	return (
		<EnvironmentContext.Provider value={rootEnv}>
			<RoutingContext.Provider value={routing}>
				<RequestProvider>
					<ContemberClient
						apiBaseUrl={props.apiBaseUrl}
						sessionToken={props.sessionToken}
						loginToken={props.loginToken}
						project={projectSlug}
						stage={props.stage}
					>
						<EnvironmentExtensionProvider extension={projectEnvironmentExtension} state={projectSlug ?? null}>
							<DataViewPageNameKeyProvider>
								<IdentityProvider>
									{/*todo outdated application dialog*/}
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
