import { useEffect, useMemo, useState } from 'react'
import { ContemberClient } from '@contember/react-client'
import { ClientConfig } from '../../bootstrap'
import { configureStore, Store } from '../../store'
import { populateRequest } from '../../actions'
import { ReduxStoreProvider } from '../../temporaryHacks'
import { DialogProvider } from '@contember/ui'
import { ProjectEntrypointInner } from './ProjectEntrypointInner'
import { emptyRequestState } from '../../state/request'
import { Environment, EnvironmentContext } from '@contember/binding'
import { I18nProvider } from '../../i18n'
import { NavigationProvider } from '../NavigationProvider'
import { ProjectConfig } from './ProjectConfig'
import { Toaster, ToasterProvider } from '../Toaster'
import { IdentityProvider } from '../Identity'
import { RoutingContext, RoutingContextValue } from '../../routing'

export interface ProjectEntrypointProps { // TODO: better props names
	basePath?: string
	clientConfig: ClientConfig
	projectConfig: ProjectConfig
}

export const ProjectEntrypoint = (props: ProjectEntrypointProps) => {

	const routing: RoutingContextValue = useMemo(() => ({
		basePath: props.basePath ?? '',
		routes: props.projectConfig.routes,
		defaultDimensions: props.projectConfig.defaultDimensions,
	}), [props.basePath, props.projectConfig.defaultDimensions, props.projectConfig.routes])

	const [store] = useState(() => { // TODO: move out to new "runAdmin"
		const store: Store = configureStore(
			{
				request: emptyRequestState,
			},
		)

		store.dispatch(populateRequest(routing, window.location))

		return store
	})

	useEffect(
		() => {
			const onPopState = (e: PopStateEvent) => {
				e.preventDefault()
				store.dispatch(populateRequest(routing, window.location))
			}

			window.addEventListener('popstate', onPopState)

			return () => {
				window.removeEventListener('popstate', onPopState)
			}
		},
		[routing, store],
	)

	const rootEnv = Environment.create({ // TODO: move back to useState?
		...props.clientConfig.envVariables,
		dimensions: props.projectConfig.defaultDimensions ?? {},
	})

	return (
		<EnvironmentContext.Provider value={rootEnv}>
			<I18nProvider
				localeCode={props.projectConfig.defaultLocale}
				dictionaries={props.projectConfig.dictionaries}
			>
				<RoutingContext.Provider value={routing}>
					<ReduxStoreProvider store={store}>
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
					</ReduxStoreProvider>
				</RoutingContext.Provider>
			</I18nProvider>
		</EnvironmentContext.Provider>
	)
}
