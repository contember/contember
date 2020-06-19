import { FieldName } from './primitives'

export interface DesugaredAnyField {
	field: FieldName
}

export interface AnyField {
	isNonbearing: boolean
	field: FieldName
}

export interface SugarableAnyField {
	field: FieldName
}

export interface UnsugarableAnyField {
	isNonbearing?: boolean
}
