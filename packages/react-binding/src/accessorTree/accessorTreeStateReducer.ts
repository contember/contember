import type { AccessorTreeState } from './AccessorTreeState'
import type { AccessorTreeStateAction } from './AccessorTreeStateAction'

export const accessorTreeStateReducer = (
	previousState: AccessorTreeState,
	action: AccessorTreeStateAction,
): AccessorTreeState => {
	switch (action.type) {
		case 'setData':
			if (previousState.name === 'error' || previousState.binding !== action.binding) {
				return previousState
			}
			return {
				name: 'initialized',
				environment: previousState.environment,
				binding: previousState.binding,
				data: action.data,
			}
		case 'failWithError':
			if (previousState.binding !== action.binding) {
				return previousState
			}
			return {
				name: 'error',
				environment: previousState.environment,
				binding: previousState.binding,
				error: action.error,
			}
		case 'reset':
			return {
				name: 'initializing',
				environment: action.environment,
				binding: action.binding,
			}
	}
}
