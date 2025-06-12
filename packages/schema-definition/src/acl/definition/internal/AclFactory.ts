import { Acl, Model, Writable } from '@contember/schema'
import { getEntity } from '@contember/schema-utils'

import { EntityPredicatesResolver } from './EntityPredicateResolver'
import { AllowDefinition } from '../permissions'
import {
	allowDefinitionsStore,
	EntityPermissionsDefinition,
} from './stores'
import { Role } from '../roles'
import {  VariableDefinition } from '../variables'
import { filterEntityDefinition } from '../../../utils'
import { applyEntityAclExtensions } from '../aclExtensions'

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

		const groupedPermissions = this.groupPermissions(entityLikeDefinition, roles)

		return {
			roles: Object.fromEntries(roles.map((role): [string, Acl.RolePermissions] => {
				const rolePermissions = groupedPermissions.get(role)
				return [
					role.name,
					{
						...role.options,
						stages: role.options.stages ?? '*',
						entities: this.createPermissions(rolePermissions, Object.fromEntries(entityLikeDefinition), role),
						variables: this.createVariables(role, variables),
					},
				]
			})),
		}
	}

	private createPermissions(rolePermissions: PermissionsByEntity | undefined, entityLikeDefinition: Record<string, { new(): any }>, role: Role): Acl.Permissions {
		return Object.fromEntries(Object.values(this.model.entities).map((entity): [string, Acl.EntityPermissions] | undefined => {
			const permissions = rolePermissions ? this.createPermissionsFromAllow(rolePermissions, entity) : { predicates: {}, operations: {} }
			const isEmpty = !rolePermissions?.has(entity.name)
			const withExtensions = applyEntityAclExtensions(entityLikeDefinition[entity.name], { entity, permissions, role })
			if (isEmpty && withExtensions === permissions) {
				return undefined
			}
			return [
				entity.name,
				withExtensions,
			]
		}).filter(<T>(it: T | undefined): it is T => it !== undefined))
	}

	private createPermissionsFromAllow(rolePermissions: PermissionsByEntity, entity: Model.Entity): Acl.EntityPermissions {
		const predicatesResolver = EntityPredicatesResolver.create(rolePermissions, this.model, entity)

		const entityOperations: Writable<Acl.EntityOperations> = {}
		const noRootOptions = this.getNoRootOptions(entity, rolePermissions.get(entity.name))
		if (noRootOptions?.length) {
			entityOperations.noRoot = noRootOptions
		}
		for (const op of ['create', 'update', 'read'] as const) {
			const fieldPermissions: Writable<Acl.FieldPermissions> = {}
			for (const field of Object.keys(entity.fields)) {
				const predicate = predicatesResolver.createFieldPredicate(op, field, field === entity.primary)
				if (predicate !== undefined) {
					fieldPermissions[field] = predicate
				}
			}
			if (Object.keys(fieldPermissions).length > 0) {
				entityOperations[op] = fieldPermissions
			}
		}
		const delPredicate = predicatesResolver.createFieldPredicate('delete', '', false)
		if (delPredicate !== undefined) {
			entityOperations.delete = delPredicate
		}
		return {
			predicates: predicatesResolver.getUsedPredicates(),
			operations: entityOperations,
		}
	}


	getNoRootOptions(entity: Model.Entity, permissions?: EntityPermissions): Acl.EntityOperations['noRoot'] {
		const allowedRoot = new Set<Acl.Operation>()
		const disallowedRoot = new Set<Acl.Operation>()
		for (const def of permissions?.definitions ?? []) {
			const noRoot = def.through === true
			for (const op of ['create', 'read', 'update', 'delete'] as const) {
				if (def[op]) {
					const currentSet = noRoot ? disallowedRoot : allowedRoot
					currentSet.add(op as Acl.Operation)

					const otherSet = noRoot ? allowedRoot : disallowedRoot

					if (otherSet.has(op as Acl.Operation)) {
						throw new Error(`Operation ${op} cannot be both allowed and disallowed on root on entity ${entity.name}`)
					}
				}
			}

		}
		return [...disallowedRoot.values()]
	}

	private createVariables(role: Role, variables: VariableDefinition[]): Acl.Variables {
		const roleVariables = variables.filter(it => it.roles.includes(role))
		return Object.fromEntries(roleVariables.map((variable): [string, Acl.Variable] => {
			return [variable.name, variable.variable]
		}))
	}

	private groupPermissions(entityLikeDefinition: [string, { new(): any }][], roles: Role[]): PermissionsByRoleAndEntity {
		const groupedPermissions: PermissionsByRoleAndEntity = new Map()
		for (const [name, entity] of entityLikeDefinition) {
			const initEntityPermissions = (role: Role): EntityPermissions => {
				const rolePermissions: PermissionsByEntity = groupedPermissions.get(role) ?? new Map()
				groupedPermissions.set(role, rolePermissions)
				const entityPermissions = rolePermissions.get(name) ?? {
					definitions: [],
				}
				rolePermissions.set(name, entityPermissions)
				return entityPermissions
			}
			const metadata: EntityPermissionsDefinition[] = allowDefinitionsStore.get(entity)
			for (const { role, factory } of metadata) {
				if (!roles.includes(role)) {
					throw `Role ${role.name} used on entity ${name} is not registered. Have you exported it?`
				}
				const entityPermissions = initEntityPermissions(role)
				const entity = getEntity(this.model, name)
				entityPermissions.definitions.push(factory({
					model: this.model,
					entity: getEntity(this.model, name),
					except: (...fields) => (Object.keys(entity.fields)).filter(it => !fields.includes(it)),
				}))
			}
		}

		return groupedPermissions
	}
}


export type EntityPermissions = { definitions: AllowDefinition<any>[] }
export type PermissionsByEntity = Map<string, EntityPermissions>
export type PermissionsByRoleAndEntity = Map<Role, PermissionsByEntity>
