import * as React from 'react'
import { Provider } from 'react-redux'
import { createAction } from 'redux-actions'
import { populateRequest } from '../actions/request'
import { EnvironmentContext } from '../binding/coreComponents'
import { Environment } from '../binding/dao'
import { Router } from '../containers/router'
import { PROJECT_CONFIGS_REPLACE } from '../reducer/projectsConfigs'
import { emptyState } from '../state'
import { ProjectConfig } from '../state/projectsConfigs'
import { PageRequest } from '../state/request'

import { configureStore, Store } from '../store'
import Login from './Login'
import ProjectsList from './ProjectsList'
import Config, { validateConfig } from '../config'

export interface AdminProps {
	configs: ProjectConfig[]
	config: Config
}

export default class Admin extends React.Component<AdminProps> {
	store: Store

	constructor(props: AdminProps) {
		super(props)

		validateConfig(props.config)

		this.store = configureStore(emptyState, props.config)
		this.store.dispatch(createAction(PROJECT_CONFIGS_REPLACE, () => this.props.configs)())
		this.store.dispatch(populateRequest(document.location!))
		window.onpopstate = e => {
			e.preventDefault()
			this.store.dispatch(populateRequest(document.location!))
		}
	}

	render() {
		return (
			<Provider store={this.store}>
				<Router
					routes={{
						login: () => <Login />,
						projects_list: () => <ProjectsList configs={this.props.configs} />,
						project_page: (() => {
							const normalizedConfigs: {
								[project: string]: {
									[stage: string]: ProjectConfig & {
										lazyComponent: React.LazyExoticComponent<React.ComponentType<any>>
									}
								}
							} = {}

							for (const config of this.props.configs) {
								if (!(config.project in normalizedConfigs)) {
									normalizedConfigs[config.project] = {}
								}
								if (config.stage in normalizedConfigs[config.project]) {
									throw new Error(
										`Duplicate project-stage pair supplied for project '${config.project}' and stage '${config.stage}'`
									)
								}
								normalizedConfigs[config.project][config.stage] = {
									...config,
									lazyComponent: React.lazy(config.component)
								}
							}

							return ({ route }: { route: PageRequest<any> }) => {
								const config = this.props.configs.find(
									({ project, stage }) => project === route.project && stage === route.stage
								)
								const Component = normalizedConfigs[route.project][route.stage].lazyComponent
								if (config) {
									const environment = new Environment({ dimensions: route.dimensions })
									return (
										<EnvironmentContext.Provider value={environment}>
											<React.Suspense fallback={'Loading...'}>
												<Component />
											</React.Suspense>
										</EnvironmentContext.Provider>
									)
								} else {
									return (
										<>
											{`No such project or stage as ${route.project}/${route.stage}`}
										</>
									)
								}
							}
						})()
					}}
				/>
			</Provider>
		)
	}
}
