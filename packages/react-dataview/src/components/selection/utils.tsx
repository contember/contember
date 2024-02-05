import { DataViewSelectionState, DataViewSelectionValue } from '../../types'
import { DataViewHasSelectionProps } from './DataViewHasSelection'

export const resolveValue = (state: DataViewSelectionState, props: { fallback?: DataViewSelectionValue, name: string }) => {
	return props.name in state.values ? state.values[props.name] : (props.fallback ?? state.fallback)
}

export const resolveCondition = (state: DataViewSelectionState, props: DataViewHasSelectionProps): boolean => {
	const value = resolveValue(state, props)

	return ('value' in props && value === props.value) || (!('value' in props) && !!value)
}
