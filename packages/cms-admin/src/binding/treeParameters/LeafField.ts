import { FieldName, FieldValue, OptionallyVariableFieldValue } from './primitives'

// These are specific to leaf fields. Common but required parameters are in AnyField.

export interface DesugaredLeafField {
	name: FieldName
}

export interface LeafField {
	name: FieldName
	defaultValue: FieldValue | undefined
}

export interface SugarableLeafField {
	name: FieldName
}

export interface UnsugarableLeafField {
	defaultValue?: OptionallyVariableFieldValue
}
