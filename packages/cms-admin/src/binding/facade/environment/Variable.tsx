import * as React from 'react'
import { EnvironmentContext } from '../../coreComponents'
import { Environment } from '../../dao'

interface VariableProps {
	name: Environment.Name
}

export const Variable = (props: VariableProps): React.ReactElement => {
	const environment = React.useContext(EnvironmentContext)

	return <>{environment.getValueOrElse(props.name, null)}</>
}
