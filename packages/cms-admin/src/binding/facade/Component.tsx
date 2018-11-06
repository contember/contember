import * as React from 'react'
import { EnvironmentContext, SyntheticChildrenProvider } from '../coreComponents'
import { Environment } from '../dao'

type Component<P> = {
	render(props: Readonly<{ children?: React.ReactNode }> & Readonly<P>, environment: Environment): React.ReactNode
	displayName?: string
}

const Component = <P extends {}, S>(
	Parent: React.ComponentClass<P, S> & Component<P>
): React.ComponentClass<P, S> & SyntheticChildrenProvider<P> => {
	class Child extends Parent {
		public static propTypes = Parent.propTypes
		public static contextTypes = Parent.contextTypes
		public static childContextTypes = Parent.childContextTypes
		public static defaultProps = Parent.defaultProps
		public static displayName = Parent.displayName || 'UserComponent'

		public render() {
			return (
				<EnvironmentContext.Consumer>
					{(environment: Environment) => Parent.render(this.props, environment)}
				</EnvironmentContext.Consumer>
			)
		}

		public static generateSyntheticChildren(props: P, environment: Environment): React.ReactNode {
			return Parent.render(props, environment)
		}
	}

	return Child
}

export { Component }
