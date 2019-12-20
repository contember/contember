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

export interface MutationResponse {
	ok: boolean
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
