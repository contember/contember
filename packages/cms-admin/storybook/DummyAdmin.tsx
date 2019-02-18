import * as React from 'react'
import { Provider } from 'react-redux'
import { emptyState } from '../src/state'

import { configureStore, Store } from '../src/store'
import { RouteMap } from '../src/components/pageRouting/utils'
import { Toast } from '../src/state/toasts'

class DummyAdmin extends React.Component<DummyAdmin.Props> {
	store: Store

	public static defaultProps: Partial<DummyAdmin.Props> = {
		toasts: []
	}

	constructor(props: DummyAdmin.Props) {
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
				},
				toasts: { toasts: this.props.toasts }
			},
			{ apiServer: 'https://example.com', loginToken: 'XXX' }
		)
	}

	render() {
		return <Provider store={this.store}>{this.props.children}</Provider>
	}
}

namespace DummyAdmin {
	export interface Props {
		toasts: Toast[]
	}
}

export { DummyAdmin }
