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

export type VariableInput = VariableScalar | VariableLiteral | Literal

export type Filter<T = Literal> = Input.Where<Input.Condition<Input.ColumnValue<T>>>

export type By<T = Literal> = Input.UniqueWhere<T>
