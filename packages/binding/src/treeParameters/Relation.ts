import { AnyField, DesugaredAnyField, SugarableAnyField, UnsugarableAnyField } from './AnyField'
import {
	DesugaredEntityCreationParameters,
	EntityCreationParameters,
	SugarableEntityCreationParameters,
	UnsugarableEntityCreationParameters,
} from './EntityCreationParameters'

export interface DesugaredRelation extends DesugaredAnyField, DesugaredEntityCreationParameters {}

export interface Relation extends AnyField, EntityCreationParameters {}

export interface SugarableRelation extends SugarableAnyField, SugarableEntityCreationParameters {}

export interface UnsugarableRelation extends UnsugarableAnyField, UnsugarableEntityCreationParameters {}
