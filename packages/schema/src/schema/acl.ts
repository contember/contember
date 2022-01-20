import Input from './input'

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

	export interface EntityVariable {
		type: VariableType.entity
		entityName: string
	}

	export interface PredefinedVariable {
		type: VariableType.predefined
		value: 'identityID' | 'personID'
	}


	// export interface ColumnValueVariable {
	// 	type: VariableType.column
	// 	entityName: string
	// 	fieldName: string
	// }

	export type VariableValue = string | number | readonly (string | number)[]

	export interface VariablesMap {
		[name: string]: VariableValue
	}

	export type PredicateVariable = string //{ name: string }
	export type PredicateDefinition<E = never> = Input.Where<PredicateVariable | Input.Condition | E>

	export type PredicateMap = { [name: string]: PredicateDefinition }

	export interface EntityPermissions {
		predicates: PredicateMap
		operations: EntityOperations
	}

	export enum Operation {
		read = 'read',
		create = 'create',
		update = 'update',
		delete = 'delete',
	}

	export interface EntityOperations {
		read?: FieldPermissions
		create?: FieldPermissions
		customPrimary?: boolean
		update?: FieldPermissions
		delete?: Predicate
	}

	export type FieldPermissions = { [field: string]: Predicate | undefined }

	export type PredicateReference = string
	export type Predicate = PredicateReference | boolean

	export type AnyStage = '*'
	export type StagesDefinition = AnyStage | string[]

	export type TenantManagePermissions = {
		[role: string]: {
			variables: Record<string, string> // target variable => source variable
		}
	}
	export interface TenantPermissions {
		invite?: boolean
		unmanagedInvite?: boolean
		manage?: TenantManagePermissions
	}

	export enum SystemPermissionsLevel {
		none = 'none',
		any = 'any',
		some = 'some',
	}

	/**
	 * @deprecated
	 */
	export type LimitedSystemPermissionsLevel = SystemPermissionsLevel.any | SystemPermissionsLevel.none

	export interface SystemPermissions {
		history?: boolean | LimitedSystemPermissionsLevel
		migrate?: boolean
		assumeIdentity?: boolean
	}

	export type RolePermissions = {
		inherits?: string[]
		tenant?: TenantPermissions
		system?: SystemPermissions
		variables: Acl.Variables
		stages?: StagesDefinition
		entities: Permissions
	} & Record<string, unknown>

	export interface Permissions {
		[entity: string]: EntityPermissions
	}

	export type Roles = { [role: string]: RolePermissions }
	export type Variables = { [name: string]: Variable }

	export interface Schema {
		roles: Acl.Roles
	}
}

export default Acl
