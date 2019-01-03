import * as React from 'react'
import { EnvironmentContext, Props, SyntheticChildrenProvider } from '../coreComponents'
import { Environment } from '../dao'

interface Component<P extends {}, S> extends React.ComponentClass<P, S> {
	render(props: Props<P>, environment: Environment): React.ReactNode
}

const Component = <P extends {}, S = {}>(
	Parent: Component<P, S> | React.FunctionComponent<P>,
	displayName?: string
): React.ComponentClass<P, S> & SyntheticChildrenProvider<P> => {
	const NormalizedParent: React.ComponentClass<P, S> = 'render' in Parent ? Parent : React.Component
	const render: (props: Props<P>, environment: Environment) => React.ReactNode =
		'render' in Parent ? Parent.render : Parent

	class Child extends NormalizedParent {
		public static propTypes = NormalizedParent.propTypes
		public static contextTypes = NormalizedParent.contextTypes
		public static childContextTypes = NormalizedParent.childContextTypes
		public static defaultProps = NormalizedParent.defaultProps
		public static displayName = NormalizedParent.displayName || displayName || 'UserComponent'

		public render() {
			return (
				<EnvironmentContext.Consumer>
					{(environment: Environment) => render(this.props, environment)}
				</EnvironmentContext.Consumer>
			)
		}

		public static generateSyntheticChildren(props: P, environment: Environment): React.ReactNode {
			return render(props, environment)
		}
	}

	return Child
}

export { Component }
