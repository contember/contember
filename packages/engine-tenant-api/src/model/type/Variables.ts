export interface RoleVariablesDefinition {
	name: string
	variables: readonly VariableDefinition[]
}

export type VariableDefinition = { name: string } & EntityVariableDefinition

export interface EntityVariableDefinition {
	entityName: string
}
