import { ContemberClient } from '@contember/react-client'
import { ClientConfig } from '../../bootstrap'
import { DialogProvider } from '@contember/ui'
import { ProjectEntrypointInner } from './ProjectEntrypointInner'
import { Environment, EnvironmentContext } from '@contember/binding'
import { NavigationProvider } from '../NavigationProvider'
import { ProjectConfig } from './ProjectConfig'
import { Toaster, ToasterProvider } from '../Toaster'
import { IdentityProvider } from '../Identity'
import { RoutingContext, RoutingContextValue } from '../../routing'
import { RequestProvider } from '../../routing/RequestContext'
import { I18nProvider } from '../../i18n'

export interface ProjectEntrypointProps {
	basePath?: string
	clientConfig: ClientConfig
	projectConfig: ProjectConfig
}

export const ProjectEntrypoint = (props: ProjectEntrypointProps) => {
	const rootEnv = Environment.create({
		...props.clientConfig.envVariables,
		dimensions: props.projectConfig.defaultDimensions ?? {},
	})

	const routing: RoutingContextValue = {
		basePath: props.basePath ?? '/',
		routes: props.projectConfig.routes,
		defaultDimensions: props.projectConfig.defaultDimensions,
	}

	return (
		<EnvironmentContext.Provider value={rootEnv}>
			<I18nProvider
				localeCode={props.projectConfig.defaultLocale}
				dictionaries={props.projectConfig.dictionaries}
			>
				<RoutingContext.Provider value={routing}>
					<RequestProvider>
						<ToasterProvider>
							<DialogProvider>
								<ContemberClient
									apiBaseUrl={props.clientConfig.apiBaseUrl}
									sessionToken={props.clientConfig.sessionToken}
									project={props.projectConfig.project}
									stage={props.projectConfig.stage}
								>
									<NavigationProvider>
										<IdentityProvider>
											<ProjectEntrypointInner Component={props.projectConfig.component} />
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
