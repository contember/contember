import { AnyField, DesugaredAnyField, SugarableAnyField, UnsugarableAnyField } from './AnyField'
import {
	DesugaredEntityCreationParameters,
	EntityCreationParameters,
	SugarableEntityCreationParameters,
	UnsugarableEntityCreationParameters,
} from './EntityCreationParameters'
import { FieldName } from './primitives'

export interface DesugaredRelation extends DesugaredAnyField, DesugaredEntityCreationParameters {
	field: FieldName
}

export interface Relation extends AnyField, EntityCreationParameters {
	field: FieldName
}

export interface SugarableRelation extends SugarableAnyField, SugarableEntityCreationParameters {
	field: FieldName
}

export interface UnsugarableRelation extends UnsugarableAnyField, UnsugarableEntityCreationParameters {}
