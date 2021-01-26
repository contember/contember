import { Environment, EnvironmentContext } from '@contember/binding'
import { ContemberClient } from '@contember/react-client'
import { ContainerSpinner } from '@contember/ui'
import * as React from 'react'
import { createAction } from 'redux-actions'
import { populateRequest } from '../actions/request'
import { assertValidClientConfig, ClientConfig } from '../bootstrap'
import { Router } from '../containers/router'
import { PROJECT_CONFIGS_REPLACE } from '../reducer/projectsConfigs'
import { emptyState } from '../state'
import { ProjectConfig } from '../state/projectsConfigs'
import { PageRequest } from '../state/request'

import { configureStore, Store } from '../store'
import { ReduxStoreProvider } from '../temporaryHacks'
import { Login } from './Login'
import { NavigationIsActiveProvider, NavigationProvider } from './NavigationProvider'
import ProjectsList from './ProjectsList'
import { Toaster } from './ui'

export interface AdminProps {
	configs: ProjectConfig[]
	clientConfig: ClientConfig
}

export const Admin = React.memo((props: AdminProps) => {
	const [] = React.useState(() => {
		assertValidClientConfig(props.clientConfig)
	})
	const [store] = React.useState(() => {
		const store: Store = configureStore(emptyState, props.clientConfig)
		store.dispatch(createAction(PROJECT_CONFIGS_REPLACE, () => props.configs)())
		store.dispatch(populateRequest(window.location))

		return store
	})
	const [adminWideEnvironment] = React.useState(() => Environment.create(props.clientConfig.envVariables))

	React.useEffect(() => {
		const onPopState = (e: PopStateEvent) => {
			e.preventDefault()
			store.dispatch(populateRequest(window.location))
		}
		window.addEventListener('popstate', onPopState)

		return () => {
			window.removeEventListener('popstate', onPopState)
		}
	}, [store])

	return (
		<ContemberClient apiBaseUrl={props.clientConfig.apiBaseUrl} loginToken={props.clientConfig.loginToken}>
			<ReduxStoreProvider store={store}>
				<NavigationProvider>
					<NavigationIsActiveProvider>
						<Router
							routes={{
								login: () => <Login />,
								projects_list: () => <ProjectsList configs={props.configs} />,
								project_page: (() => {
									const normalizedConfigs: {
										[project: string]: {
											[stage: string]: ProjectConfig & {
												lazyComponent: React.LazyExoticComponent<React.ComponentType<any>>
												rootEnvironment: Environment
											}
										}
									} = {}

									for (const config of props.configs) {
										if (!(config.project in normalizedConfigs)) {
											normalizedConfigs[config.project] = {}
										}
										if (config.stage in normalizedConfigs[config.project]) {
											throw new Error(
												`Duplicate project-stage pair supplied for project '${config.project}' and stage '${config.stage}'`,
											)
										}
										normalizedConfigs[config.project][config.stage] = {
											...config,
											lazyComponent: React.lazy(config.component),
											rootEnvironment: adminWideEnvironment.putDelta({
												dimensions: config.defaultDimensions || {},
											}),
										}
									}

									return ({ route }: { route: PageRequest<any> }) => {
										const config = props.configs.find(
											({ project, stage }) => project === route.project && stage === route.stage,
										)
										const relevantConfig = normalizedConfigs[route.project][route.stage]
										const Component = relevantConfig.lazyComponent

										if (config) {
											relevantConfig.rootEnvironment = relevantConfig.rootEnvironment
												.updateDimensionsIfNecessary(route.dimensions, config.defaultDimensions || {})
												.putDelta({
													...route.parameters,
												})
											return (
												<ContemberClient
													apiBaseUrl={props.clientConfig.apiBaseUrl}
													loginToken={props.clientConfig.loginToken}
													project={route.project}
													sessionToken={store.getState().auth.identity?.token}
													stage={route.stage}
												>
													<EnvironmentContext.Provider value={relevantConfig.rootEnvironment}>
														<React.Suspense fallback={<ContainerSpinner />}>
															<Component />
														</React.Suspense>
													</EnvironmentContext.Provider>
												</ContemberClient>
											)
										} else {
											return <>{`No such project or stage as ${route.project}/${route.stage}`}</>
										}
									}
								})(),
							}}
						/>
						<Toaster />
					</NavigationIsActiveProvider>
				</NavigationProvider>
			</ReduxStoreProvider>
		</ContemberClient>
	)
})
Admin.displayName = 'Admin'
