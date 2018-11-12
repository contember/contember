import { Input } from 'cms-common'
import { Literal, VariableLiteral, VariableScalar } from './dao'

// TODO These shouldn't just be strings
// TODO this should be an ambient declaration file but Lerna messes that up

export type FieldName = string
export type EntityName = string

export type Scalar = string | number | boolean | null
export type ReceivedFieldData<A = never> = Scalar | ReceivedEntityData<A> | Array<ReceivedEntityData<A> | A>
export type ReceivedEntityData<A = never> =
	| A
	| {
			id: string
			[fieldName: string]: ReceivedFieldData<A>
	  }
export type ReceivedData<A = never> = A | ReceivedEntityData<A> | ReceivedEntityData<A>[]

export type VariableInput = VariableScalar | VariableLiteral | Literal

export type Filter<T = VariableInput> = Input.Where<Input.Condition<Input.ColumnValue<T>>>
