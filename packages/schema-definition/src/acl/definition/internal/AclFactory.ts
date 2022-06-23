import { Acl, Model, Writable } from '@contember/schema'
import { getEntity } from '@contember/schema-utils'

import { EntityPredicatesResolver } from './EntityPredicateResolver.js'
import { AllowDefinition } from '../permissions.js'
import {
	allowCustomPrimaryAllRolesStore,
	allowCustomPrimaryStore,
	allowDefinitionsStore,
	EntityPermissionsDefinition,
} from './stores.js'
import { Role } from '../roles.js'
import {  VariableDefinition } from '../variables.js'
import { filterEntityDefinition } from '../../../utils/index.js'

export class AclFactory {
	constructor(
		private model: Model.Schema,
	) {
	}

	public create(
		exportedDefinitions: Record<string, any>,
	): Acl.Schema {
		const entityLikeDefinition = filterEntityDefinition(exportedDefinitions)
		const roles: Role[] = Object.values(exportedDefinitions).filter(it => it instanceof Role)
		const variables: VariableDefinition[] = Object.values(exportedDefinitions).filter(it => it instanceof VariableDefinition)

		const groupedPermissions = AclFactory.groupPermissions(entityLikeDefinition, roles)

		return {
			roles: Object.fromEntries(roles.map((role): [string, Acl.RolePermissions] => {
				const rolePermissions = groupedPermissions.get(role)
				return [
					role.name,
					{
						stages: role.options.stages ?? '*',
						entities: this.createPermissions(rolePermissions),
						variables: this.createVariables(role, variables),
					},
				]
			})),
		}
	}

	private createPermissions(rolePermissions: PermissionsByEntity | undefined): Acl.Permissions {
		if (!rolePermissions) {
			return {}
		}
		return Object.fromEntries(Array.from(rolePermissions.keys()).map((entityName): [string, Acl.EntityPermissions] => {
			const entity = getEntity(this.model, entityName)

			const predicatesResolver = EntityPredicatesResolver.create(rolePermissions, this.model, entity)

			const entityOperations: Writable<Acl.EntityOperations> = {}
			for (const op of ['create', 'update', 'read'] as const) {
				const fieldPermissions: Writable<Acl.FieldPermissions> = {}
				for (const field of Object.keys(entity.fields)) {
					if (field === entity.primary) {
						continue
					}
					const predicate = predicatesResolver.createFieldPredicate(op, field)
					if (predicate !== undefined) {
						fieldPermissions[field] = predicate
					}
				}
				if (Object.keys(fieldPermissions).length > 0) {
					entityOperations[op] = fieldPermissions
				}
			}
			const delPredicate = predicatesResolver.createFieldPredicate('delete', '')
			if (delPredicate !== undefined) {
				entityOperations.delete = delPredicate
			}
			if (rolePermissions.get(entityName)?.allowCustomPrimary) {
				entityOperations.customPrimary = true
			}
			return [entityName, {
				predicates: predicatesResolver.getUsedPredicates(),
				operations: entityOperations,
			}]
		}))
	}

	private createVariables(role: Role, variables: VariableDefinition[]): Acl.Variables {
		const roleVariables = variables.filter(it => it.roles.includes(role))
		return Object.fromEntries(roleVariables.map((variable): [string, Acl.Variable] => {
			return [variable.name, variable.variable]
		}))
	}

	private static groupPermissions(entityLikeDefinition: [string, { new(): any }][], roles: Role[]): PermissionsByRoleAndEntity {
		const groupedPermissions: PermissionsByRoleAndEntity = new Map()
		for (const [name, entity] of entityLikeDefinition) {
			const initEntityPermissions = (role: Role): EntityPermissions => {
				const rolePermissions: PermissionsByEntity = groupedPermissions.get(role) ?? new Map()
				groupedPermissions.set(role, rolePermissions)
				const entityPermissions = rolePermissions.get(name) ?? {
					allowCustomPrimary: false,
					definitions: [],
				}
				rolePermissions.set(name, entityPermissions)
				return entityPermissions
			}
			const metadata: EntityPermissionsDefinition[] = allowDefinitionsStore.get(entity)
			for (const { role, ...definition } of metadata) {
				if (!roles.includes(role)) {
					throw `Role ${role.name} used on entity ${name} is not registered. Have you exported it?`
				}
				const entityPermissions = initEntityPermissions(role)
				entityPermissions.definitions.push(definition)
			}

			const rolesWithCustomPrimary = allowCustomPrimaryAllRolesStore.get(entity) ? roles : allowCustomPrimaryStore.get(entity)
			for (const role of rolesWithCustomPrimary) {
				initEntityPermissions(role).allowCustomPrimary = true
			}
		}

		return groupedPermissions
	}
}


export type EntityPermissions = { definitions: AllowDefinition<any>[]; allowCustomPrimary: boolean }
export type PermissionsByEntity = Map<string, EntityPermissions>
export type PermissionsByRoleAndEntity = Map<Role, PermissionsByEntity>
