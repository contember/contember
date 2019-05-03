import Input from './input'

namespace Acl {
	export enum VariableType {
		enum = 'enum',
		entity = 'entity',
		column = 'column'
	}

	export type Variable = EnumVariable | EntityVariable | ColumnValueVariable

	export interface EnumVariable {
		type: VariableType.enum
		enumName: string
	}

	export interface EntityVariable {
		type: VariableType.entity
		entityName: string
	}

	export interface ColumnValueVariable {
		type: VariableType.column
		entityName: string
		fieldName: string
	}

	export interface VariablesMap {
		[name: string]: string | number | (string | number)[]
	}

	export type PredicateVariable = string //{ name: string }
	export type PredicateDefinition = Input.Where<PredicateVariable | Input.Condition>

	export type PredicateMap = { [name: string]: PredicateDefinition }

	export interface EntityPermissions {
		predicates: PredicateMap
		operations: EntityOperations
	}

	export enum Operation {
		read = 'read',
		create = 'create',
		update = 'update',
		delete = 'delete'
	}

	export interface EntityOperations {
		read?: FieldPermissions
		create?: FieldPermissions
		update?: FieldPermissions
		delete?: Predicate
	}

	export type FieldPermissions = { [field: string]: Predicate }

	export type PredicateReference = string
	export type Predicate = PredicateReference | true

	export type AnyStage = '*'
	export type StagesDefinition = AnyStage | (string[])

	export interface RolePermissions {
		inherits?: string[]
		stages: StagesDefinition
		entities: Permissions
	}

	export interface Permissions {
		[entity: string]: EntityPermissions
	}

	export type Roles = { [role: string]: RolePermissions }
	export type Variables = { [name: string]: Variable }

	export interface Schema {
		variables: Acl.Variables
		roles: Acl.Roles
	}
}

export default Acl
