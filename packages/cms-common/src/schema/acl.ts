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

	type PredicateVariable = string //{ name: string }
	type PredicateDefinition = Input.Where<PredicateVariable>

	interface EntityPermissions {
		predicates: { [name: string]: PredicateDefinition }
		operations: EntityOperations
	}

	interface EntityOperations {
		read?: FieldPermissions
		create?: FieldPermissions
		update?: FieldPermissions
		delete?: PredicateReference
	}

	type FieldPermissions = { [field: string]: PredicateReference }
	type PredicateReference = string | true

	interface RolePermissions {
		inherits?: string[]
		entities: { [entity: string]: EntityPermissions }
	}

	export type Roles = { [role: string]: RolePermissions }
	export type Variables = { [name: string]: Variable }

	export interface VariableCondition {
		and?: PredicateVariable
		or?: PredicateVariable
		not?: VariableCondition

		eq?: PredicateVariable
		null?: PredicateVariable
		notEq?: PredicateVariable
		in?: PredicateVariable
		notIn?: PredicateVariable
		lt?: PredicateVariable
		lte?: PredicateVariable
		gt?: PredicateVariable
		gte?: PredicateVariable
	}

	export interface Schema {
		variables: Acl.Variables
		roles: Acl.Roles
	}
}

export default Acl
