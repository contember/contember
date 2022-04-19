import { Acl, Model } from '@contember/schema'
import { AllowAllPermissionFactory } from '@contember/schema-utils'
import PermissionOverrider from './PermissionOverrider'
import EntitySelector from './EntitySelector'
import EntityPermissionsBuilder from './EntityPermissionsBuilder'
import FieldSelector from './FieldSelector'
import Reference from './PredicateReference'

class PermissionsBuilder {
	constructor(public readonly schema: Model.Schema, public readonly permissions: Acl.Permissions) {}

	public static create(model: Model.Schema): PermissionsBuilder {
		return new PermissionsBuilder(model, {})
	}

	public allowAll(): PermissionsBuilder {
		return this.allow([Acl.Operation.read, Acl.Operation.update, Acl.Operation.delete, Acl.Operation.create])
	}

	public allow(operations: Acl.Operation[]): PermissionsBuilder {
		const allowAllFactory = new AllowAllPermissionFactory(operations)
		return this.add(allowAllFactory.create(this.schema))
	}

	public allowCustomPrimary(): PermissionsBuilder {
		return this.onEveryEntity().allowCustomPrimary().builder
	}

	public add(permissions: Acl.Permissions): PermissionsBuilder {
		const overrider = new PermissionOverrider()
		return new PermissionsBuilder(this.schema, overrider.override(this.permissions, permissions))
	}

	public onEntity(entitySelector: EntitySelector | string | string[]): EntityPermissionsBuilder {
		if (typeof entitySelector === 'string') {
			entitySelector = EntitySelector.named(entitySelector)
		} else if (Array.isArray(entitySelector)) {
			entitySelector = EntitySelector.named(...entitySelector)
		}
		const entitySelectorWithType = entitySelector
		const entities = Object.values(this.schema.entities).filter(entity =>
			entitySelectorWithType.matches(this.schema, entity),
		)
		return new EntityPermissionsBuilder(this, entities)
	}

	public onEveryEntity(): EntityPermissionsBuilder {
		return this.onEntity(EntitySelector.every())
	}
}

namespace PermissionsBuilder {
	export const everyEntity = () => {
		return EntitySelector.every()
	}
	export const everyField = () => {
		return FieldSelector.every()
	}
	export const predicateReference = (name: Acl.PredicateReference) => new Reference(name)
}
export { PermissionsBuilder }
