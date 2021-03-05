import {
	ReactNode,
	ComponentType,
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useRef,
	useState,
	FC,
	FunctionComponent,
	Fragment,
	PureComponent,
	useEffect,
} from 'react'
import { Environment, useEnvironment } from '@contember/binding'

interface VariableProps {
	name: Environment.Name
	format?: (value: ReactNode) => ReactNode
}

export const Variable = memo(
	({ name, format }: VariableProps): ReactElement => {
		const environment = useEnvironment()
		const value = environment.getValueOrElse(name, null)

		const formatted = useMemo(() => (format ? format(value) : value), [format, value])

		return <>{formatted}</>
	},
)
Variable.displayName = 'Variable'
