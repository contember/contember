import type { AnyField, DesugaredAnyField, SugarableAnyField, UnsugarableAnyField } from './AnyField'
import type {
	DesugaredEntityCreationParameters,
	EntityCreationParameters,
	SugarableEntityCreationParameters,
	UnsugarableEntityCreationParameters,
} from './EntityCreationParameters'
import type { ExpectedRelationMutation } from './primitives'

export const RelationDefaults = {
	expectedMutation: 'anyMutation',
} as const

export interface DesugaredRelation extends DesugaredAnyField, DesugaredEntityCreationParameters {}

export interface Relation extends AnyField, EntityCreationParameters {
	expectedMutation: ExpectedRelationMutation
}

export interface SugarableRelation extends SugarableAnyField, SugarableEntityCreationParameters {}

export interface UnsugarableRelation extends UnsugarableAnyField, UnsugarableEntityCreationParameters {
	expectedMutation?: ExpectedRelationMutation
}
