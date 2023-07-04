import { Environment, EnvironmentContext, EnvironmentExtensionProvider } from '@contember/binding'
import { ContemberClient, ContemberClientProps } from '@contember/react-client'
import { Providers as InterfaceProviders } from '@contember/ui'
import { ComponentType, PropsWithChildren, ReactNode } from 'react'
import { I18nProvider, MessageDictionaryByLocaleCode } from '../i18n'
import { RequestProvider, RouteMap, RoutingContext, RoutingContextValue, SelectedDimension } from '../routing'
import { OutdatedApplicationChecker } from './Application/OutdatedApplicationChecker'
import { ApplicationDevBar } from './Dev/DevBar'
import { IdentityProvider } from './Identity'
import { NavigationProvider } from './NavigationProvider'
import { projectEnvironmentExtension } from './Project'

export interface ApplicationEntrypointProps extends ContemberClientProps {
	basePath?: string
	sessionToken?: string
	routes?: RouteMap
	defaultDimensions?: SelectedDimension
	defaultLocale?: string
	dictionaries?: MessageDictionaryByLocaleCode
	envVariables?: Record<string, string>
	children: ReactNode
	onInvalidIdentity?: () => void
	devBarPanels?: ReactNode
	providers?: ComponentType<PropsWithChildren>
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

	const Providers = props.providers ?? InterfaceProviders

	return (
		<EnvironmentContext.Provider value={rootEnv}>
			<I18nProvider localeCode={props.defaultLocale} dictionaries={props.dictionaries}>
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
								<NavigationProvider>
									<IdentityProvider onInvalidIdentity={props.onInvalidIdentity}>
										<Providers>
											<OutdatedApplicationChecker />
											{props.children}
											<ApplicationDevBar panels={props.devBarPanels} />
										</Providers>
									</IdentityProvider>
								</NavigationProvider>
							</EnvironmentExtensionProvider>
						</ContemberClient>
					</RequestProvider>
				</RoutingContext.Provider>
			</I18nProvider>
		</EnvironmentContext.Provider>
	)
}
