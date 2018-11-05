import * as React from 'react'
import { Provider } from 'react-redux'
import { createAction } from 'redux-actions'
import { populateRequest } from '../actions/request'
import Router from '../containers/router'
import { PROJECT_CONFIGS_REPLACE } from '../reducer/projectsConfigs'
import { emptyState } from '../state'
import { ProjectConfig } from '../state/projectsConfigs'

import { configureStore, Store } from '../store'
import Login from './Login'
import ProjectsList from './ProjectsList'
import RenderPromise from './RenderPromise'

export interface AdminProps {
	configs: ProjectConfig[]
}

export default class Admin extends React.Component<AdminProps> {
	store: Store

	constructor(props: AdminProps) {
		super(props)

		this.store = configureStore(emptyState)
		this.store.dispatch(createAction(PROJECT_CONFIGS_REPLACE, () => this.props.configs)())
		this.store.dispatch(populateRequest(document.location))
		window.onpopstate = e => {
			e.preventDefault()
			this.store.dispatch(populateRequest(document.location))
		}
	}

	render() {
		return (
			<Provider store={this.store}>
				<Router
					routes={{
						login: route => <Login />,
						projects_list: route => <ProjectsList configs={this.props.configs} />,
						project_page: route => {
							const config = this.props.configs.find(
								({ project, stage }) => project === route.project && stage === route.stage
							)
							if (config) {
								return <RenderPromise>{config.component()}</RenderPromise>
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
