import * as React from 'react'
import { EnvironmentContext } from '../../coreComponents'
import { Environment } from '../../dao'

interface VariableProps {
	name: Environment.Name
}

export class Variable extends React.PureComponent<VariableProps> {
	public render() {
		return (
			<EnvironmentContext.Consumer>{environment => environment.getValue(this.props.name)}</EnvironmentContext.Consumer>
		)
	}
}
