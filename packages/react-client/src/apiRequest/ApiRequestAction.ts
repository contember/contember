import type { GraphQlClientFailedRequestMetadata } from '@contember/client'

export type ApiRequestAction<SuccessData> =
	| {
			type: 'uninitialize'
	  }
	| {
			type: 'initialize'
	  }
	| {
			type: 'resolveSuccessfully'
			data: SuccessData
	  }
	| {
			type: 'resolveWithError'
			error: GraphQlClientFailedRequestMetadata
	  }
