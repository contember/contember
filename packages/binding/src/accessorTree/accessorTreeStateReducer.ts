import type { AccessorTreeState } from './AccessorTreeState'
import type { AccessorTreeStateAction } from './AccessorTreeStateAction'

export const accessorTreeStateReducer = (
	previousState: AccessorTreeState,
	action: AccessorTreeStateAction,
): AccessorTreeState => {
	switch (action.type) {
		case 'setData':
			if (previousState.name === 'error') {
				return previousState
			}
			return {
				name: 'initialized',
				data: action.data,
			}
		case 'failWithError':
			return {
				name: 'error',
				error: action.error,
			}
		case 'reset':
			return {
				name: 'initializing',
			}
	}
}
