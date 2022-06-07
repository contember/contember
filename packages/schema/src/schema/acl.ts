import Input from './input'
import { JSONValue } from './json'

namespace Acl {
	export enum VariableType {
		entity = 'entity',
		predefined = 'predefined',

		// currently unsupported
		// enum = 'enum',
		// column = 'column',
	}

	export type Variable = EntityVariable | PredefinedVariable  // | EnumVariable | ColumnValueVariable

	// export interface EnumVariable {
	// 	type: VariableType.enum
	// 	enumName: string
	// }

	export type EntityVariable = {
		readonly type: VariableType.entity
		readonly entityName: string
	}

	export type PredefinedVariableValue = 'identityID' | 'personID'
	export type PredefinedVariable = {
		readonly type: VariableType.predefined
		readonly value: PredefinedVariableValue
	}


	// export interface ColumnValueVariable {
	// 	type: VariableType.column
	// 	entityName: string
	// 	fieldName: string
	// }

	export type VariableValue = string | number | readonly (string | number)[]

	export type VariablesMap = {
		readonly [name: string]: VariableValue
	}

	export type PredicateVariable = string //{ name: string }
	export type PredicateDefinition<E = never> = Input.Where<PredicateVariable | Input.Condition | E>

	export type PredicateMap = { readonly [name: string]: PredicateDefinition }

	export type EntityPermissions = {
		readonly predicates: PredicateMap
		readonly operations: EntityOperations
	}

	export enum Operation {
		read = 'read',
		create = 'create',
		update = 'update',
		delete = 'delete',
	}

	export type EntityOperations = {
		readonly read?: FieldPermissions
		readonly create?: FieldPermissions
		readonly customPrimary?: boolean
		readonly update?: FieldPermissions
		readonly delete?: Predicate
	}

	export type FieldPermissions = { readonly [field: string]: Predicate }

	export type PredicateReference = string
	export type Predicate = PredicateReference | boolean

	export type AnyStage = '*'
	export type StagesDefinition = AnyStage | readonly string[]

	export type MembershipVariableMatchRule = true | string

	export type MembershipVariablesMatchRule =
		| true
		| {
			readonly [targetVariable: string]: MembershipVariableMatchRule
		}

	export type MembershipRoleMatchRule =
		| true
		| {
			readonly variables?: MembershipVariablesMatchRule
		}

	export type MembershipMatchRule = {
		readonly [role: string]: MembershipRoleMatchRule
	}

	export type TenantPermissions = {
		readonly invite?: boolean
		readonly unmanagedInvite?: boolean
		readonly manage?: MembershipMatchRule
	}

	export enum SystemPermissionsLevel {
		none = 'none',
		any = 'any',
		some = 'some',
	}

	/**
	 * @deprecated
	 */
	export type LimitedSystemPermissionsLevel = 'any' | 'none'

	export type SystemPermissions = {
		readonly history?: boolean | LimitedSystemPermissionsLevel
		readonly migrate?: boolean
		readonly assumeIdentity?: boolean
	}

	export type ContentPermissions = {
		readonly assumeMembership?: MembershipMatchRule
	}

	export interface BaseRolePermissions {
		readonly inherits?: readonly string[]
		readonly implicit?: boolean
		readonly tenant?: TenantPermissions
		readonly system?: SystemPermissions
		readonly content?: ContentPermissions
		readonly variables: Acl.Variables
		readonly stages?: StagesDefinition
		readonly entities: Permissions
	}
	export type RolePermissions =
		& BaseRolePermissions
		& {
			readonly [key: string] : JSONValue
		}
	export type Permissions = {
		readonly [entity: string]: EntityPermissions
	}

	export type Roles = { readonly [role: string]: RolePermissions }
	export type Variables = { readonly [name: string]: Variable }

	export type Schema = {
		readonly customPrimary?: boolean
		readonly roles: Acl.Roles
	}
}

export default Acl
