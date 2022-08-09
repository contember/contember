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
				binding: previousState.binding,
				name: 'initialized',
				data: action.data,
			}
		case 'failWithError':
			if (previousState.binding !== action.binding) {
				return previousState
			}
			return {
				binding: previousState.binding,
				name: 'error',
				error: action.error,
			}
		case 'reset':
			return {
				binding: action.binding,
				name: 'initializing',
			}
	}
}
