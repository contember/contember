import { Result } from '@contember/schema'

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

export interface MutationError {
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
	errors: ExecutionError[]
	validation: {
		valid: boolean
		errors: MutationError[]
	}
	node: {
		id: string
	}
}

export interface MutationDataResponse {
	[alias: string]: MutationResponse
}

export interface MutationRequestResponse {
	data: MutationDataResponse
}
