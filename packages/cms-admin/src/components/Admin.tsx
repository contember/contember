import * as React from 'react'
import { Provider } from 'react-redux'
import { createAction } from 'redux-actions'
import { populateRequest } from '../actions/request'
import { EnvironmentContext } from '../binding/coreComponents'
import { Environment } from '../binding/dao'
import Router from '../containers/router'
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
						login: route => <Login />,
						projects_list: route => <ProjectsList configs={this.props.configs} />,
						project_page: (route: PageRequest<any>) => {
							const config = this.props.configs.find(
								({ project, stage }) => project === route.project && stage === route.stage
							)
							if (config) {
								const Component = React.lazy(config.component)
								const environment = new Environment({ dimensions: route.dimensions })
								return (
									<EnvironmentContext.Provider value={environment}>
										<React.Suspense fallback={'Loading...'}>
											<Component />
										</React.Suspense>
									</EnvironmentContext.Provider>
								)
							} else {
								return `No such project or stage as ${route.project}/${route.stage}`
							}
						}
					}}
				/>
			</Provider>
		)
	}
}
