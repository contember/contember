import { Acl, Model } from '@contember/schema'
import * as Typesafe from '@contember/typesafe'

const membershipMatchRuleSchema = Typesafe.record(
	Typesafe.string,
	Typesafe.union(
		Typesafe.literal(true),
		Typesafe.partial({
			variables: Typesafe.union(
				Typesafe.literal(true),
				Typesafe.record(
					Typesafe.string,
					Typesafe.union(Typesafe.literal(true), Typesafe.string),
				),
			),
		}),
	),
)

const tenantPermissionsSchema = Typesafe.partial({
	invite: Typesafe.boolean,
	unmanagedInvite: Typesafe.boolean,
	manage: membershipMatchRuleSchema,
})
const tenantSchemaCheck: Typesafe.Equals<Acl.TenantPermissions, ReturnType<typeof tenantPermissionsSchema>> = true

const systemPermissionsSchema = Typesafe.partial({
	history: Typesafe.union(Typesafe.boolean, Typesafe.enumeration('any', 'none')),
	migrate: Typesafe.boolean,
	assumeIdentity: Typesafe.boolean,
	export: Typesafe.boolean,
	import: Typesafe.boolean,
})
const systemSchemaCheck: Typesafe.Equals<Acl.SystemPermissions, ReturnType<typeof systemPermissionsSchema>> = true

const contentPermissionsSchema = Typesafe.partial({
	assumeMembership: membershipMatchRuleSchema,
	export: Typesafe.boolean,
	import: Typesafe.boolean,
})
const contentSchemaCheck: Typesafe.Equals<Acl.ContentPermissions, ReturnType<typeof contentPermissionsSchema>> = true

const variablesSchema = Typesafe.record(
	Typesafe.string,
	Typesafe.union(
		Typesafe.object({
			type: Typesafe.literal(Acl.VariableType.entity),
			entityName: Typesafe.string,
		}),
		Typesafe.object({
			type: Typesafe.literal(Acl.VariableType.predefined),
			value: Typesafe.enumeration('identityID', 'personID'),
		}),
		Typesafe.object({
			type: Typesafe.literal(Acl.VariableType.condition),
		}),
	),
)

const variableSchemaCheck: Typesafe.Equals<Acl.Variables, ReturnType<typeof variablesSchema>> = true

const fieldPermissionsSchema = Typesafe.record(
	Typesafe.string,
	Typesafe.union(Typesafe.string, Typesafe.boolean),
)
const predicatesSchema = Typesafe.record(
	Typesafe.string,
	(v, p): Acl.PredicateDefinition => Typesafe.anyJsonObject(v, p) as Acl.PredicateDefinition,
)

const predicatesSchemaCheck: Typesafe.Equals<Acl.PredicateMap, ReturnType<typeof predicatesSchema>> = true

const entityOperationsSchema = Typesafe.partial({
	read: fieldPermissionsSchema,
	create: fieldPermissionsSchema,
	update: fieldPermissionsSchema,
	delete: Typesafe.union(Typesafe.string, Typesafe.boolean),
	customPrimary: Typesafe.boolean,
})
const opSchemaCheck: Typesafe.Equals<Acl.EntityOperations, ReturnType<typeof entityOperationsSchema>> = true
const entitiesSchema = Typesafe.record(
	Typesafe.string,
	Typesafe.object({
		predicates: predicatesSchema,
		operations: entityOperationsSchema,
	}),
)
const entitiesSchemaCheck: Typesafe.Equals<Acl.Permissions, ReturnType<typeof entitiesSchema>> = true

const baseRolePermissionsSchema = Typesafe.intersection(
	Typesafe.object({
		variables: variablesSchema,
		entities: entitiesSchema,
	}),
	Typesafe.partial({
		inherits: Typesafe.array(Typesafe.string),
		implicit: Typesafe.boolean,
		stages: Typesafe.union(
			Typesafe.literal('*'),
			Typesafe.array(Typesafe.string),
		),
		tenant: tenantPermissionsSchema,
		system: systemPermissionsSchema,
		content: contentPermissionsSchema,
	}),
)
const baseRolePermissionsCheck: Typesafe.Equals<Acl.BaseRolePermissions, ReturnType<typeof baseRolePermissionsSchema>> = true

export const aclSchema = Typesafe.intersection(
	Typesafe.object({
		roles: Typesafe.record(
			Typesafe.string,
			(v, p): Acl.RolePermissions => {
				const main: Acl.BaseRolePermissions = baseRolePermissionsSchema(v, p)
				return {
					...(v as any),
					...main,
				}
			},
		),
	}),
	Typesafe.partial({
		customPrimary: Typesafe.boolean,
	}),
)
const aclSchemaCheck: Typesafe.Equals<Acl.Schema, ReturnType<typeof aclSchema>> = true
