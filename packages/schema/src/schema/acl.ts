import { Input } from './input'
import { JSONValue } from './json'

export namespace Acl {
	export enum VariableType {
		entity = 'entity',
		predefined = 'predefined',
		condition = 'condition',

		// currently unsupported
		// enum = 'enum',
		// column = 'column',
	}

	export type Variable =
		| EntityVariable
		| PredefinedVariable
		| ConditionVariable
		// | EnumVariable | ColumnValueVariable



	export type EntityVariable = {
		readonly type: VariableType.entity
		readonly entityName: string
		readonly fallback?: Input.Condition
	}

	export type PredefinedVariableValue = 'identityID' | 'personID'
	export type PredefinedVariable = {
		readonly type: VariableType.predefined
		readonly value: PredefinedVariableValue
	}


	export type ConditionVariable = {
		readonly type: VariableType.condition
		readonly fallback?: Input.Condition
	}

	// export interface EnumVariable {
	// 	type: VariableType.enum
	// 	enumName: string
	// }

	// export interface ColumnValueVariable {
	// 	type: VariableType.column
	// 	entityName: string
	// 	fieldName: string
	// }

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
		readonly update?: FieldPermissions
		readonly delete?: Predicate
		readonly noRoot?: readonly `${Operation}`[]

		readonly customPrimary?: boolean
		readonly refreshMaterializedView?: boolean
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

	export type MembershipMatchRule =
		| boolean
		| {
			readonly [role: string]: MembershipRoleMatchRule
		}

	export type TenantPermissions = {
		readonly invite?: MembershipMatchRule
		readonly unmanagedInvite?:MembershipMatchRule
		readonly view?: MembershipMatchRule
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
		readonly export?: boolean
		readonly import?: boolean
	}

	export type ContentPermissions = {
		readonly assumeMembership?: MembershipMatchRule
		readonly export?: boolean
		readonly import?: boolean
		readonly refreshMaterializedView?: boolean
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
		readonly debug?: boolean
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

	export type VariablesMap = {
		readonly [name: string]: Input.Condition
	}

	export interface MembershipVariable {
		readonly name: string
		readonly values: readonly string[]
	}

	export interface Membership {
		readonly role: string
		readonly variables: readonly MembershipVariable[]
	}
}
