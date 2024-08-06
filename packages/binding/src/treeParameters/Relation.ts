import type { AnyField } from './AnyField'
import type { EntityCreationParameters } from './EntityCreationParameters'
import type { ExpectedRelationMutation } from './primitives'

export const RelationDefaults = {
	expectedMutation: 'anyMutation',
} as const

export interface Relation extends AnyField, EntityCreationParameters {
	expectedMutation: ExpectedRelationMutation
}
