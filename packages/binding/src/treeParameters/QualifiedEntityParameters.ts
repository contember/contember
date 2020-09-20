import { Alias, EntityName, ExpectedQualifiedEntityMutation } from './primitives'

export const QualifiedEntityParametersDefaults = {
	expectedMutation: 'anyMutation',
} as const

export interface DesugaredQualifiedEntityParameters {
	entityName: EntityName
}

export interface QualifiedEntityParameters {
	alias: Set<Alias> | undefined
	entityName: EntityName
	expectedMutation: ExpectedQualifiedEntityMutation
}

export interface SugarableQualifiedEntityParameters {
	entityName: EntityName
}

export interface UnsugarableQualifiedEntityParameters {
	alias?: Alias | Set<Alias>
	expectedMutation?: ExpectedQualifiedEntityMutation
}
