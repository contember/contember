import { Component } from '@contember/react-binding'
import { DataViewSelectionValue } from '../../types'
import { dataViewSelectionEnvironmentExtension } from '../../dataViewSelectionEnvironmentExtension'
import { useDataViewSelectionState } from '../../contexts'
import { resolveCondition } from './utils'

export interface DataViewHasSelectionProps {
	name: string
	value?: DataViewSelectionValue
	fallback?: DataViewSelectionValue
	children: React.ReactNode;
}

export const DataViewHasSelection = Component<DataViewHasSelectionProps>(props => {
	const selection = useDataViewSelectionState()
	if (!selection) {
		return null
	}

	return resolveCondition(selection, props) ? <>{props.children}</> : null
}, (props, env) => {
	const selection = env.getExtension(dataViewSelectionEnvironmentExtension)
	return resolveCondition(selection, props) ? props.children : null
})
