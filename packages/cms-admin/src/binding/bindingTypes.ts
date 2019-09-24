import { Input } from '@contember/schema'
import { Literal, VariableLiteral, VariableScalar } from './dao'

// TODO These shouldn't just be strings

export type QualifiedFieldList = string
export type QualifiedEntityList = string
export type RelativeSingleField = string
export type RelativeSingleEntity = string
export type RelativeEntityList = string

export type UniqueWhere = string

export type FieldName = string
export type EntityName = string

export enum ExpectedCount {
	UpToOne = 'UpToOne',
	PossiblyMany = 'PossiblyMany',
}

export const PRIMARY_KEY_NAME = 'id'
export const TYPENAME_KEY_NAME = '__typename'

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

export interface MutationResult {
	ok: boolean
	validation: {
		valid: boolean
		errors: MutationError[]
	}
	node: {
		id: string
	}
}

export interface MutationRequestResult {
	[alias: string]: MutationResult
}

export interface QueryRequestResult {
	data: ReceivedData
}

export type VariableInput = VariableScalar | VariableLiteral | Literal

export type Filter<T = Literal> = Input.Where<Input.Condition<Input.ColumnValue<T>>>

export type By<T = Literal> = Input.UniqueWhere<T>
