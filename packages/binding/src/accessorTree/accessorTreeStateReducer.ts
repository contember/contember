import { AccessorTreeState, AccessorTreeStateName } from './AccessorTreeState'
import { AccessorTreeStateAction } from './AccessorTreeStateAction'
import { AccessorTreeStateActionType } from './AccessorTreeStateActionType'

export const accessorTreeStateReducer = (
	previousState: AccessorTreeState,
	action: AccessorTreeStateAction,
): AccessorTreeState => {
	switch (action.type) {
		case AccessorTreeStateActionType.SetData:
			if (previousState.name === AccessorTreeStateName.Error) {
				return previousState
			}
			return {
				name: AccessorTreeStateName.Initialized,
				data: action.data,
			}
		case AccessorTreeStateActionType.FailWithError:
			return {
				name: AccessorTreeStateName.Error,
				error: action.error,
			}
		case AccessorTreeStateActionType.Reset:
			return {
				name: AccessorTreeStateName.Initializing,
			}
	}
}
