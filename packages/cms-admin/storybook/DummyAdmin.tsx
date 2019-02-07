import * as React from 'react'
import { Provider } from 'react-redux'
import { emptyState } from '../src/state'

import { configureStore, Store } from '../src/store'
import { RouteMap } from '../src/components/pageRouting/utils'


export class DummyAdmin extends React.Component<{}> {
	store: Store

	constructor(props: {}) {
		super(props)

		// validateConfig(props.config)
		const everyPage: RouteMap = new Proxy(
			{},
			{
				get: (target, prop) => {
					if (typeof prop === 'string') {
						return { path: `/${prop}` }
					} else {
						return undefined
					}
				}
			}
		)

		this.store = configureStore(
			{
				...emptyState,
				view: {
					loading: false,
					route: {
						name: 'project_page',
						dimensions: {},
						pageName: 'dummy',
						parameters: {},
						project: 'storybook',
						stage: 'dev'
					}
				},
				projectsConfigs: {
					configs: [
						{
							project: 'storybook',
							stage: 'dev',
							component: () => Promise.reject(),
							routes: everyPage
						}
					]
				}
			},
			{ apiServer: 'https://example.com', loginToken: 'XXX' }
		)
	}

	render() {
		return <Provider store={this.store}>{this.props.children}</Provider>
	}
}
