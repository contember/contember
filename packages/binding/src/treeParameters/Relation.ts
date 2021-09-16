import type { AnyField, SugarableAnyField } from './AnyField'
import type { EntityCreationParameters, UnsugarableEntityCreationParameters } from './EntityCreationParameters'
import type { ExpectedRelationMutation } from './primitives'

export const RelationDefaults = {
	expectedMutation: 'anyMutation',
} as const

export interface Relation extends AnyField, EntityCreationParameters {
	expectedMutation: ExpectedRelationMutation
}

export interface SugarableRelation extends SugarableAnyField {}

export interface UnsugarableRelation extends UnsugarableEntityCreationParameters {
	expectedMutation?: ExpectedRelationMutation
}
