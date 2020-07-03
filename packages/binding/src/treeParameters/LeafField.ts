import { FieldValue, OptionallyVariableFieldValue } from './primitives'

// These are specific to leaf fields. Common but required parameters are in AnyField.

export const LeafFieldDefaults = {
	isNonbearing: false,
} as const

export interface DesugaredLeafField {}

export interface LeafField {
	isNonbearing: boolean
	defaultValue: FieldValue | undefined
}

export interface SugarableLeafField {}

export interface UnsugarableLeafField {
	isNonbearing?: boolean
	defaultValue?: OptionallyVariableFieldValue
}
