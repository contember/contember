import type { GraphQlClientError } from '@contember/client'

export type ApiRequestState<SuccessData> =
	| {
		isLoading: false
		isFinished: false
		readyState: 'uninitialized'
	  }
	| {
		isLoading: true
		isFinished: false
		readyState: 'pending'
	  }
	| {
		isLoading: false
		isFinished: true
		readyState: 'networkSuccess'
		data: SuccessData
	  }
	| {
		isLoading: false
		isFinished: true
		readyState: 'networkError'
		data: GraphQlClientError
	  }
