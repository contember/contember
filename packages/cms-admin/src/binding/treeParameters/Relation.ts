import { AnyField, SugarableAnyField, UnsugarableAnyField } from './AnyField'
import {
	EntityCreationParameters,
	SugarableEntityCreationParameters,
	UnsugarableEntityCreationParameters,
} from './EntityCreationParameters'

export interface Relation extends AnyField, EntityCreationParameters {}

export interface SugarableRelation extends SugarableAnyField, SugarableEntityCreationParameters {}

export interface UnsugarableRelation extends UnsugarableAnyField, UnsugarableEntityCreationParameters {}
