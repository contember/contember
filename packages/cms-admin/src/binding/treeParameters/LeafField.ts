import { FieldValue, OptionallyVariableFieldValue } from './primitives'

// These are specific to leaf fields. Common but required parameters are in AnyField.

export interface DesugaredLeafField {}

export interface LeafField {
	defaultValue: FieldValue | undefined
}

export interface SugarableLeafField {}

export interface UnsugarableLeafField {
	defaultValue?: OptionallyVariableFieldValue
}
