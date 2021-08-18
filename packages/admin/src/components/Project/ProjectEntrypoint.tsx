import { useEffect, useState } from 'react'
import { ContemberClient } from '@contember/react-client'
import { ClientConfig } from '../../bootstrap'
import { configureStore, Store } from '../../store'
import { populateRequest } from '../../actions'
import { ReduxStoreProvider } from '../../temporaryHacks'
import { DialogProvider } from '@contember/ui'
import { Toaster } from '../ui'
import type { ProjectConfig } from 'index'
import { ProjectEntrypointInner } from './ProjectEntrypointInner'
import { emptyRequestState } from '../../state/request'
import { emptyAuthState } from '../../state/auth'
import { emptyToastsState } from '../../state/toasts'

export interface ProjectEntrypointProps { // TODO: better props names
	basePath: string
	clientConfig: ClientConfig
	projectConfig: ProjectConfig
}

export const ProjectEntrypoint = (props: ProjectEntrypointProps) => {
	const [store] = useState(() => { // TODO: move out to new "runAdmin"
		const store: Store = configureStore(
			{
				basePath: props.basePath,
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

	return (
		<ReduxStoreProvider store={store}>
			<DialogProvider>
				<ContemberClient
					apiBaseUrl={props.clientConfig.apiBaseUrl}
					sessionToken={props.clientConfig.sessionToken}
					project={props.projectConfig.project}
					stage={props.projectConfig.stage}
				>
					<ProjectEntrypointInner clientConfig={props.clientConfig} projectConfig={props.projectConfig} />
				</ContemberClient>
				<Toaster />
			</DialogProvider>
		</ReduxStoreProvider>
	)
}
