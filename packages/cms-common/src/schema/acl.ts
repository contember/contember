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

	export type PredicateVariable = string //{ name: string }
	export type PredicateDefinition = Input.Where<VariableCondition>

	export type PredicateMap = { [name: string]: PredicateDefinition }

	export interface EntityPermissions {
		predicates: PredicateMap
		operations: EntityOperations
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

	export interface RolePermissions {
		inherits?: string[]
		entities: Permissions
	}

	export interface Permissions {
		[entity: string]: EntityPermissions
	}

	export type Roles = { [role: string]: RolePermissions }
	export type Variables = { [name: string]: Variable }

	export interface VariableCondition {
		and?: VariableCondition[]
		or?: VariableCondition[]
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
