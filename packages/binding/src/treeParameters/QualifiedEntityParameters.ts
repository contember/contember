import { EntityName, ExpectedQualifiedEntityMutation } from './primitives'

export const QualifiedEntityParametersDefaults = {
	expectedMutation: 'anyMutation',
} as const

export interface DesugaredQualifiedEntityParameters {
	entityName: EntityName
}

export interface QualifiedEntityParameters {
	entityName: EntityName
	expectedMutation: ExpectedQualifiedEntityMutation
}

export interface SugarableQualifiedEntityParameters {
	entityName: EntityName
}

export interface UnsugarableQualifiedEntityParameters {
	expectedMutation?: ExpectedQualifiedEntityMutation
}
