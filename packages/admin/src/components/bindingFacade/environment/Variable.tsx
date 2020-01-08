import * as React from 'react'
import { Environment, useEnvironment } from '@contember/binding'

interface VariableProps {
	name: Environment.Name
	format?: (value: React.ReactNode) => React.ReactNode
}

export const Variable = React.memo(
	({ name, format }: VariableProps): React.ReactElement => {
		const environment = useEnvironment()
		const value = environment.getValueOrElse(name, null)

		const formatted = React.useMemo(() => (format ? format(value) : value), [format, value])

		return <>{formatted}</>
	},
)
Variable.displayName = 'Variable'
