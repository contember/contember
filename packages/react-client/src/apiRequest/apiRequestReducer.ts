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
				readyState: 'uninitialized',
				isFinished: false,
				isLoading: false,
			}
		case ApiRequestActionType.Initialize:
			return {
				readyState: 'pending',
				isFinished: false,
				isLoading: true,
			}
		case ApiRequestActionType.ResolveSuccessfully:
			return {
				readyState: 'networkSuccess',
				data: action.data,
				isFinished: true,
				isLoading: false,
			}
		case ApiRequestActionType.ResolveWithError:
			return {
				readyState: 'networkError',
				data: action.error,
				isFinished: true,
				isLoading: false,
			}
	}
}
