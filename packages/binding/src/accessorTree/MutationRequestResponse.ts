import type { Result } from '@contember/client'
import type { ReceivedEntityData } from './QueryRequestResponse'

type WithType<V, Type extends string> = V & { __typename: Type }

export interface FieldPathErrorFragment {
	__typename: '_FieldPathFragment'
	field: string
}

export interface IndexPathErrorFragment {
	__typename: '_IndexPathFragment'
	index: number
	alias: string | null
}

export type ErrorPathNodeType = FieldPathErrorFragment | IndexPathErrorFragment

export type MutationErrorPath = ErrorPathNodeType[]

export interface ValidationError {
	path: MutationErrorPath
	message: {
		text: string
	}
}

export interface ExecutionError {
	path: MutationErrorPath
	type: Result.ExecutionErrorType
	message: string | null
}

export interface MutationResponse {
	ok: boolean
	errorMessage: string | null
	errors: ExecutionError[]
	validation:
		| {
				valid: boolean
				errors: ValidationError[]
		  }
		| undefined
	node: ReceivedEntityData
}

export interface MutationDataResponse {
	[alias: string]: MutationResponse
}

export interface MutationTransactionResponse {
	transaction: WithType<MutationDataResponse, 'MutationTransaction'> | null
}

export interface MutationRequestResponse {
	data: MutationTransactionResponse | null
	errors?: { message: string, path?: string[] }[]
}
