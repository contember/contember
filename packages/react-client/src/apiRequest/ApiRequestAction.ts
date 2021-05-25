import type { GraphQlClient } from '@contember/client'
import type { ApiRequestActionType } from './ApiRequestActionType'

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
