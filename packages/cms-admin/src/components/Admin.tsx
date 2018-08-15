import * as React from 'react'
import { Provider } from 'react-redux'
import Router from '../containers/router'
import Login from './Login'
import Link from './Link'
import { pageRequest } from '../state/request'
import RenderPromise from './RenderPromise'

import { configureStore } from '../store'
import { populateRequest } from '../actions/request'
import { emptyState } from '../state'

const store = configureStore(emptyState)
store.dispatch(populateRequest(document.location))
window.onpopstate = e => {
	e.preventDefault()
	store.dispatch(populateRequest(document.location))
}

export interface StageConfig {
	project: string
	stage: string
	component: () => Promise<React.ReactNode>
}

export interface AdminProps {
	configs: StageConfig[]
}

export default class Admin extends React.Component<AdminProps> {
	render() {
		return (
			<div>
				<Provider store={store}>
					<Router
						routes={{
							login: route => (
								<>
									<Link requestChange={pageRequest('blog', 'prod', 'dashboard', {})}>Project</Link>
									<Login />
								</>
							),
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
			</div>
		)
	}
}
