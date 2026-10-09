import { Acl, Model, Writable } from '@contember/schema'
import { getEntity } from '@contember/schema-utils'

import { EntityPredicatesResolver } from './EntityPredicateResolver.js'
import { AllowDefinition } from '../permissions.js'
import { allowDefinitionsStore, EntityPermissionsDefinition } from './stores.js'
import { Role } from '../roles.js'
import { VariableDefinition } from '../variables.js'
import { filterEntityDefinition } from '../../../utils/index.js'
import { applyEntityAclExtensions } from '../aclExtensions.js'

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

	private createPermissions(
		rolePermissions: PermissionsByEntity | undefined,
		entityLikeDefinition: Record<string, { new(): any }>,
		role: Role,
	): Acl.Permissions {
		return Object.fromEntries(
			Object.values(this.model.entities).map((entity): [string, Acl.EntityPermissions] | undefined => {
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
			}).filter(<T>(it: T | undefined): it is T => it !== undefined),
		)
	}

	/**
	 * An operation granted only through a relation keeps the legacy `noRoot` form, so a schema without a root
	 * and a through grant on the same operation stays unchanged: no ACL migration, and older engines and
	 * tools that read `noRoot` keep working. Only such a combination needs the `through` bucket, where the
	 * through grants compose with the root ones instead of conflicting.
	 */
	private createPermissionsFromAllow(rolePermissions: PermissionsByEntity, entity: Model.Entity): Acl.EntityPermissions {
		const predicatesResolver = EntityPredicatesResolver.create(rolePermissions, this.model, entity)
		const definitions = rolePermissions.get(entity.name)?.definitions ?? []
		const rootDefinitions = definitions.filter(it => it.through !== true)
		const throughDefinitions = definitions.filter(it => it.through === true)

		const rootOperations = this.createOperations(entity, predicatesResolver, rootDefinitions)
		const throughOperations = this.createOperations(entity, predicatesResolver, throughDefinitions)
		const noRoot = this.getOperationNames(rootDefinitions, throughDefinitions)

		const operations: Writable<Acl.EntityOperations> = noRoot.length > 0 ? { noRoot } : {}
		const composedThroughOperations: Writable<Acl.ThroughOperations> = {}
		const assign = <Op extends OperationName>(op: Op) => {
			const isThroughOnly = noRoot.includes(op)
			const grant = isThroughOnly ? throughOperations[op] : rootOperations[op]
			if (grant !== undefined) {
				operations[op] = grant
			}
			const throughGrant = throughOperations[op]
			if (!isThroughOnly && throughGrant !== undefined) {
				composedThroughOperations[op] = throughGrant
			}
		}
		for (const op of ['create', 'update', 'read', 'delete'] as const) {
			assign(op)
		}
		if (Object.keys(composedThroughOperations).length > 0) {
			operations.through = composedThroughOperations
		}

		return {
			predicates: predicatesResolver.getUsedPredicates(),
			operations,
		}
	}

	private getOperationNames(rootDefinitions: AllowDefinition<any>[], throughDefinitions: AllowDefinition<any>[]): OperationName[] {
		const operations = ['create', 'read', 'update', 'delete'] as const
		const rootOperations = new Set(operations.filter(op => rootDefinitions.some(it => it[op])))
		const throughOnly = throughDefinitions.flatMap(definition => operations.filter(op => definition[op] && !rootOperations.has(op)))
		return [...new Set(throughOnly)]
	}

	private createOperations(
		entity: Model.Entity,
		predicatesResolver: EntityPredicatesResolver,
		definitions: AllowDefinition<any>[],
	): Acl.ThroughOperations {
		const operations: Writable<Acl.ThroughOperations> = {}
		for (const op of ['create', 'update', 'read'] as const) {
			const fieldPermissions: Writable<Acl.FieldPermissions> = {}
			for (const field of Object.keys(entity.fields)) {
				const predicate = predicatesResolver.createFieldPredicate(op, field, field === entity.primary, definitions)
				if (predicate !== undefined) {
					fieldPermissions[field] = predicate
				}
			}
			if (Object.keys(fieldPermissions).length > 0) {
				operations[op] = fieldPermissions
			}
		}
		const delPredicate = predicatesResolver.createFieldPredicate('delete', '', false, definitions)
		if (delPredicate !== undefined) {
			operations.delete = delPredicate
		}
		return operations
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

type OperationName = keyof Acl.ThroughOperations

export type EntityPermissions = { definitions: AllowDefinition<any>[] }
export type PermissionsByEntity = Map<string, EntityPermissions>
export type PermissionsByRoleAndEntity = Map<Role, PermissionsByEntity>
