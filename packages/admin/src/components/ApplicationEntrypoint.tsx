import { Environment, EnvironmentContext } from '@contember/binding'
import { ContemberClient, ContemberClientProps } from '@contember/react-client'
import { DialogProvider, SectionTabsProvider } from '@contember/ui'
import { ReactNode } from 'react'
import { I18nProvider, MessageDictionaryByLocaleCode } from '../i18n'
import { RequestProvider, RouteMap, RoutingContext, RoutingContextValue, SelectedDimension } from '../routing'
import { IdentityProvider } from './Identity'
import { NavigationProvider } from './NavigationProvider'
import { Toaster, ToasterProvider } from './Toaster'

export interface ApplicationEntrypointProps extends ContemberClientProps {
	basePath?: string
	sessionToken: string
	routes: RouteMap
	defaultDimensions?: SelectedDimension
	defaultLocale?: string
	dictionaries?: MessageDictionaryByLocaleCode
	envVariables?: Record<string, string>
	children: ReactNode
	onInvalidIdentity?: () => void
}

const validateProps = (props: Partial<ApplicationEntrypointProps>) => {
	if (typeof props.apiBaseUrl !== 'string') {
		throw new Error(`The ENV variables haven't been set. Check your \`.env.development.local\` file.`) // TODO: better message
	}

	if (typeof props.sessionToken !== 'string') {
		throw new Error(`The ENV variables haven't been set. Check your \`.env.development.local\` file.`) // TODO: better message
	}
}

export const ApplicationEntrypoint = (props: ApplicationEntrypointProps) => {
	validateProps(props)

	const routing: RoutingContextValue = {
		basePath: props.basePath ?? '/',
		routes: props.routes,
		defaultDimensions: props.defaultDimensions,
	}

	const rootEnv = Environment.create({
		...props.envVariables,
		dimensions: props.defaultDimensions ?? {},
	})

	return (
		<EnvironmentContext.Provider value={rootEnv}>
			<I18nProvider localeCode={props.defaultLocale} dictionaries={props.dictionaries}>
				<RoutingContext.Provider value={routing}>
					<RequestProvider>
						<ToasterProvider>
							<DialogProvider>
								<ContemberClient
									apiBaseUrl={props.apiBaseUrl}
									sessionToken={props.sessionToken}
									loginToken={props.loginToken}
									project={props.project}
									stage={props.stage}
								>
									<NavigationProvider>
										<IdentityProvider onInvalidIdentity={props.onInvalidIdentity}>
											<SectionTabsProvider>
												{props.children}
											</SectionTabsProvider>
										</IdentityProvider>
									</NavigationProvider>
								</ContemberClient>
								<Toaster />
							</DialogProvider>
						</ToasterProvider>
					</RequestProvider>
				</RoutingContext.Provider>
			</I18nProvider>
		</EnvironmentContext.Provider>
	)
}
