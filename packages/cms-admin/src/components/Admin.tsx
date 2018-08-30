import * as React from 'react'
import { Provider } from 'react-redux'
import Router from '../containers/router'
import Login from './Login'
import Link from './Link'
import { pageRequest } from '../state/request'
import RenderPromise from './RenderPromise'

import { configureStore, Store } from '../store'
import { populateRequest } from '../actions/request'
import { emptyState } from '../state'
import { createAction } from 'redux-actions'
import { PROJECT_CONFIGS_REPLACE } from '../reducer/projectsConfigs'
import { ProjectConfig } from '../state/projectsConfigs'

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
