export type Scalar = string | number | boolean | null
export type ReceivedFieldData<A = never> = Scalar | ReceivedEntityData<A> | Array<ReceivedEntityData<A> | A>
export type ReceivedEntityData<A = never> =
	| A
	| {
			id: string
			__typename: string
			[fieldName: string]: ReceivedFieldData<A>
	  }
export type ReceivedData<A = never> = A | ReceivedEntityData<A> | ReceivedEntityData<A>[]

export interface ReceivedDataTree<A = never> {
	[treeId: string]: ReceivedData<A>
}

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

export interface MutationRequestResponse {
	[alias: string]: MutationResponse
}

export interface QueryRequestResponse {
	data: ReceivedData
}
