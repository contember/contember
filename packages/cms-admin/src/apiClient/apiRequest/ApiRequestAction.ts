import { GraphQlClient } from 'cms-client'
import { ApiRequestActionType } from './ApiRequestActionType'

export type ApiRequestAction<SuccessData> =
	| {
			type: ApiRequestActionType.Uninitialize
	  }
	| {
			type: ApiRequestActionType.Initialize
	  }
	| {
			type: ApiRequestActionType.ResolveSuccessfully
			data: SuccessData
	  }
	| {
			type: ApiRequestActionType.ResolveWithError
			error: GraphQlClient.FailedRequestMetadata
	  }
