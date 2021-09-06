import { RequestProvider, RouteMap, RoutingContext, RoutingContextValue, SelectedDimension } from '../routing'
import { Environment, EnvironmentContext } from '@contember/binding'
import { I18nProvider, MessageDictionaryByLocaleCode } from '../i18n'
import { Toaster, ToasterProvider } from './Toaster'
import { DialogProvider } from '@contember/ui'
import { ContemberClient, ContemberClientProps } from '@contember/react-client'
import { NavigationProvider } from './NavigationProvider'
import { IdentityProvider } from './Identity'
import { ReactNode } from 'react'

export interface ApplicationEntrypointProps extends ContemberClientProps {
	basePath?: string
	sessionToken: string
	routes: RouteMap
	defaultDimensions?: SelectedDimension
	defaultLocale?: string
	dictionaries?: MessageDictionaryByLocaleCode
	envVariables?: Record<string, string>
	children: ReactNode
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
			<I18nProvider
				localeCode={props.defaultLocale}
				dictionaries={props.dictionaries}
			>
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
										<IdentityProvider>
											{props.children}
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
