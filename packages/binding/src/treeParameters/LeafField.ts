import type { FieldEventListeners, UnsugarableFieldEventListeners } from './FieldEventListeners'
import type { FieldValue, OptionallyVariableFieldValue } from './primitives'

// These are specific to leaf fields. Common but required parameters are in AnyField.

export const LeafFieldDefaults = {
	isNonbearing: false,
} as const

export interface LeafField extends FieldEventListeners {
	isNonbearing: boolean
	defaultValue: FieldValue | undefined
}

export type UnsugarableLeafField =
	& UnsugarableFieldEventListeners
	& {
		isNonbearing?: boolean
		defaultValue?: OptionallyVariableFieldValue
	}
