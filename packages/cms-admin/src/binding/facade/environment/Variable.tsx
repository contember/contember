import * as React from 'react'
import EnvironmentContext from '../../coreComponents/EnvironmentContext'
import Environment from '../../dao/Environment'

interface VariableProps {
	name: Environment.Name
}

export default class Variable extends React.Component<VariableProps> {
	public render() {
		return (
			<EnvironmentContext.Consumer>{environment => environment.getValue(this.props.name)}</EnvironmentContext.Consumer>
		)
	}
}
