import { AnyField, SugarableAnyField, UnsugarableAnyField } from './AnyField'
import {
	RelativeSingleEntity,
	SugarableRelativeSingleEntity,
	UnsugarableRelativeSingleEntity,
} from './RelativeSingleEntity'

export interface RelativeSingleField extends RelativeSingleEntity, AnyField {}

export interface SugarableRelativeSingleField extends SugarableRelativeSingleEntity, SugarableAnyField {}

export interface UnsugarableRelativeSingleField extends UnsugarableRelativeSingleEntity, UnsugarableAnyField {}

export interface SugaredRelativeSingleField extends UnsugarableRelativeSingleField {
	// E.g. authors(id = 123).person.name
	relativeSingleField: string | SugarableRelativeSingleField
}
