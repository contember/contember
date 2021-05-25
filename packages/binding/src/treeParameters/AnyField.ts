import type { FieldName } from './primitives'

export interface DesugaredAnyField {
	field: FieldName
}

export interface AnyField {
	field: FieldName
}

export interface SugarableAnyField {
	field: FieldName
}

export interface UnsugarableAnyField {}
