import { GraphQlClient } from 'cms-client'
import { ApiRequestReadyState } from './ApiRequestReadyState'

export type ApiRequestState<SuccessData> =
	| {
			readyState: ApiRequestReadyState.Uninitialized | ApiRequestReadyState.Pending
	  }
	| {
			readyState: ApiRequestReadyState.Success
			data: SuccessData
	  }
	| {
			readyState: ApiRequestReadyState.Error
			data: GraphQlClient.FailedRequestMetadata
	  }
