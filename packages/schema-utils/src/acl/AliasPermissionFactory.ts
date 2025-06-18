import { Acl, Model } from '@contember/schema'

export class AliasPermissionFactory {

	constructor(private readonly entity: Model.Entity) { }

	public create(entityPermissions: Acl.EntityPermissions): Acl.EntityPermissions {
		const origOps = entityPermissions.operations || {}
		const newRead = { ...(origOps.read || {}) }
		const newCreate = { ...(origOps.create || {}) }
		const newUpdate = { ...(origOps.update || {}) }
		const newPredicates = { ...(entityPermissions.predicates || {}) } as Record<string, any>

		for (const fieldName in this.entity.fields) {
			const field = this.entity.fields[fieldName]
			if (field.aliases?.length) {
				for (const alias of field.aliases) {
					this.copyFieldPermissions(fieldName, alias, newRead, newCreate, newUpdate, entityPermissions)
					this.copyPredicates(fieldName, alias, newPredicates, entityPermissions)
				}
			}
		}

		return {
			...entityPermissions,
			operations: {
				...origOps,
				read: newRead,
				create: newCreate,
				update: newUpdate,
			},
			predicates: newPredicates,
		}
	}

	private copyFieldPermissions(
		fieldName: string,
		alias: string,
		newRead: Record<string, any>,
		newCreate: Record<string, any>,
		newUpdate: Record<string, any>,
		entityPermissions: Acl.EntityPermissions,
	): void {
		if (entityPermissions.operations?.read?.[fieldName] !== undefined) {
			newRead[alias] = entityPermissions.operations.read[fieldName]
		}
		if (entityPermissions.operations?.create?.[fieldName] !== undefined) {
			newCreate[alias] = entityPermissions.operations.create[fieldName]
		}
		if (entityPermissions.operations?.update?.[fieldName] !== undefined) {
			newUpdate[alias] = entityPermissions.operations.update[fieldName]
		}
	}

	private copyPredicates(
		fieldName: string,
		alias: string,
		newPredicates: Record<string, any>,
		entityPermissions: Acl.EntityPermissions,
	): void {
		if (entityPermissions.predicates?.[fieldName]) {
			newPredicates[alias] = entityPermissions.predicates[fieldName]
		}
	}
}
