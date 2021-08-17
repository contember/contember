import { Environment, EnvironmentContext } from '@contember/binding'
import { ContemberClient } from '@contember/react-client'
import { ContainerSpinner, DialogProvider } from '@contember/ui'
import { ComponentType, lazy, LazyExoticComponent, memo, Suspense, useEffect, useState } from 'react'
import { createAction } from 'redux-actions'
import { populateRequest } from '../actions/request'
import { assertValidClientConfig, ClientConfig } from '../bootstrap'
import { Router } from '../containers/router'
import { I18nProvider } from '../i18n'
import { PROJECT_CONFIGS_REPLACE } from '../reducer/projectsConfigs'
import { emptyState } from '../state'
import type { ProjectConfig } from '../state/projectsConfigs'
import type { PageRequest } from '../state/request'

import { configureStore, Store } from '../store'
import { ReduxStoreProvider } from '../temporaryHacks'
import { Login, Project } from './Login'
import { NavigationIsActiveProvider, NavigationProvider } from './NavigationProvider'
import ProjectsList from './ProjectsList'
import { Toaster } from './ui'
import type { AuthIdentity } from '../state/auth'
import { SET_IDENTITY } from '../reducer/auth'
import { useRedirect } from './pageRouting'

export interface AdminProps {
	configs: ProjectConfig[]
	clientConfig: ClientConfig
}

export const Admin = memo((props: AdminProps) => {
	const [] = useState(() => {
		assertValidClientConfig(props.clientConfig)
	})
	const [store] = useState(() => {
		const store: Store = configureStore(emptyState, props.clientConfig)
		store.dispatch(createAction(PROJECT_CONFIGS_REPLACE, () => props.configs)())
		store.dispatch(populateRequest(window.location))

		return store
	})

	const [adminWideEnvironment] = useState(() => Environment.create(props.clientConfig.envVariables))
	const redirect = useRedirect()

	useEffect(() => {
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
						<DialogProvider>
							<Router
								routes={{
									login: () => <Login onLogin={((projects, person) => {
										store.dispatch(
											createAction<AuthIdentity>(SET_IDENTITY, () => ({
												token: '__DUMMY__', // TODO: ???
												email: person.email,
												personId: person.id,
												projects: projects.map(
													(project: Project): any => ({
														slug: project.slug,
														roles: [], // TODO: ???
													}),
												),
											}))(),
										)
										redirect(() => ({ name: 'projects_list' }))
									})} />,
									projects_list: () => <ProjectsList configs={props.configs} />,
									project_page: (() => {
										const normalizedConfigs: {
											[project: string]: {
												[stage: string]: ProjectConfig & {
													lazyComponent: LazyExoticComponent<ComponentType<any>> | ComponentType
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
												lazyComponent:
													typeof config.component === 'function'
														? lazy(config.component)
														: () => <>{config.component}</>,
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
												const environment = relevantConfig.rootEnvironment
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
														<EnvironmentContext.Provider value={environment}>
															<I18nProvider
																localeCode={relevantConfig.defaultLocale}
																dictionaries={relevantConfig.dictionaries}
															>
																<Suspense fallback={<ContainerSpinner />}>
																	<Component />
																</Suspense>
															</I18nProvider>
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
						</DialogProvider>
					</NavigationIsActiveProvider>
				</NavigationProvider>
			</ReduxStoreProvider>
		</ContemberClient>
	)
})
Admin.displayName = 'Admin'
