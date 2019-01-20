import * as React from 'react'
import { EnvironmentContext, Props, SyntheticChildrenProvider } from '../coreComponents'
import { Environment } from '../dao'

interface Component<P extends {}> extends React.ComponentClass<P, undefined> {
	render(props: Props<P>, environment: Environment): React.ReactNode
}

const Component = <P extends {}>(
	Parent: Component<P> | React.FunctionComponent<P>,
	displayName?: string
): React.ComponentClass<P, undefined> & SyntheticChildrenProvider<P> => {
	const NormalizedParent: React.ComponentClass<P, undefined> = 'render' in Parent ? Parent : React.Component
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
