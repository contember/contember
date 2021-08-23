import { useEffect, useState } from 'react'
import { ContemberClient } from '@contember/react-client'
import { ClientConfig } from '../../bootstrap'
import { configureStore, Store } from '../../store'
import { populateRequest } from '../../actions'
import { ReduxStoreProvider } from '../../temporaryHacks'
import { DialogProvider } from '@contember/ui'
import { Toaster } from '../ui'
import { ProjectEntrypointInner } from './ProjectEntrypointInner'
import { emptyRequestState } from '../../state/request'
import { emptyAuthState } from '../../state/auth'
import { emptyToastsState } from '../../state/toasts'
import { Environment, EnvironmentContext } from '@contember/binding'
import { I18nProvider } from '../../i18n'
import { NavigationProvider } from '../NavigationProvider'
import { ProjectConfig } from '../../state/projectsConfigs'

export interface ProjectEntrypointProps { // TODO: better props names
	basePath?: string
	clientConfig: ClientConfig
	projectConfig: ProjectConfig
}

export const ProjectEntrypoint = (props: ProjectEntrypointProps) => {
	const [store] = useState(() => { // TODO: move out to new "runAdmin"
		const store: Store = configureStore(
			{
				basePath: props.basePath ?? '',
				request: emptyRequestState,
				auth: emptyAuthState,
				projectConfig: props.projectConfig,
				toasts: emptyToastsState,
			},
			props.clientConfig,
		)

		store.dispatch(populateRequest(window.location))

		return store
	})

	useEffect(
		() => {
			const onPopState = (e: PopStateEvent) => {
				e.preventDefault()
				store.dispatch(populateRequest(window.location))
			}

			window.addEventListener('popstate', onPopState)

			return () => {
				window.removeEventListener('popstate', onPopState)
			}
		},
		[store],
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
				<ReduxStoreProvider store={store}>
					<DialogProvider>
						<ContemberClient
							apiBaseUrl={props.clientConfig.apiBaseUrl}
							sessionToken={props.clientConfig.sessionToken}
							project={props.projectConfig.project}
							stage={props.projectConfig.stage}
						>
							<NavigationProvider>
								<ProjectEntrypointInner clientConfig={props.clientConfig} projectConfig={props.projectConfig} />
							</NavigationProvider>
						</ContemberClient>
						<Toaster />
					</DialogProvider>
				</ReduxStoreProvider>
			</I18nProvider>
		</EnvironmentContext.Provider>
	)
}
