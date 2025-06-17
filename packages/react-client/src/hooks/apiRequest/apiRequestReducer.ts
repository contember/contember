import type { ApiRequestAction } from './ApiRequestAction'
import type { ApiRequestState } from './ApiRequestState'

export type ApiRequestReducer<SuccessData> = (
	previousState: ApiRequestState<SuccessData>,
	action: ApiRequestAction<SuccessData>,
) => ApiRequestState<SuccessData>

export const apiRequestReducer = <SuccessData>(
	previousState: ApiRequestState<SuccessData>,
	action: ApiRequestAction<SuccessData>,
): ApiRequestState<SuccessData> => {
	switch (action.type) {
		case 'uninitialize':
			return {
				readyState: 'uninitialized',
				isFinished: false,
				isLoading: false,
			}
		case 'initialize':
			return {
				readyState: 'pending',
				isFinished: false,
				isLoading: true,
			}
		case 'resolveSuccessfully':
			return {
				readyState: 'networkSuccess',
				data: action.data,
				isFinished: true,
				isLoading: false,
			}
		case 'resolveWithError':
			return {
				readyState: 'networkError',
				data: action.error,
				isFinished: true,
				isLoading: false,
			}
	}
}
