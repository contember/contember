import type { Alias, EntityName, ExpectedQualifiedEntityMutation } from './primitives'

export const QualifiedEntityParametersDefaults = {
	expectedMutation: 'anyMutation',
} as const

export interface QualifiedEntityParameters {
	alias: Set<Alias> | undefined
	entityName: EntityName
	expectedMutation: ExpectedQualifiedEntityMutation
}
