import { ApiRequestAction } from './ApiRequestAction'
import { ApiRequestActionType } from './ApiRequestActionType'
import { ApiRequestReadyState } from './ApiRequestReadyState'
import { ApiRequestState } from './ApiRequestState'

export type ApiRequestReducer<SuccessData> = (
	previousState: ApiRequestState<SuccessData>,
	action: ApiRequestAction<SuccessData>,
) => ApiRequestState<SuccessData>

export const apiRequestReducer = <SuccessData>(
	previousState: ApiRequestState<SuccessData>,
	action: ApiRequestAction<SuccessData>,
): ApiRequestState<SuccessData> => {
	switch (action.type) {
		case ApiRequestActionType.Uninitialize:
			return {
				readyState: ApiRequestReadyState.Uninitialized,
			}
		case ApiRequestActionType.Initialize:
			return {
				readyState: ApiRequestReadyState.Pending,
			}
		case ApiRequestActionType.ResolveSuccessfully:
			return {
				readyState: ApiRequestReadyState.Success,
				data: action.data,
			}
		case ApiRequestActionType.ResolveWithError:
			return {
				readyState: ApiRequestReadyState.Error,
				data: action.error,
			}
	}
}
