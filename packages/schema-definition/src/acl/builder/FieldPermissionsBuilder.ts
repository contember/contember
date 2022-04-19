import FieldSelector from './FieldSelector'
import EntityPermissionsBuilder from './EntityPermissionsBuilder'
import { Acl, Model, Writable } from '@contember/schema'
import EntitySelector from './EntitySelector'
import { PermissionsBuilder } from './PermissionsBuilder'

export default class FieldPermissionsBuilder {
	public constructor(
		public entityPermissionsBuilder: EntityPermissionsBuilder,
		private readonly fields: [Model.Entity, Model.AnyField][],
	) {}

	get builder(): PermissionsBuilder {
		return this.entityPermissionsBuilder.builder
	}

	get schema(): Model.Schema {
		return this.entityPermissionsBuilder.schema
	}

	get permissions(): Acl.Permissions {
		return this.entityPermissionsBuilder.permissions
	}

	public allowCreate(predicate: Acl.Predicate = true): FieldPermissionsBuilder {
		return this.allow([Acl.Operation.create], predicate)
	}

	public allowRead(predicate: Acl.Predicate = true): FieldPermissionsBuilder {
		return this.allow([Acl.Operation.read], predicate)
	}

	public allowUpdate(predicate: Acl.Predicate = true): FieldPermissionsBuilder {
		return this.allow([Acl.Operation.update], predicate)
	}

	public allowAll(predicate: Acl.Predicate = true): FieldPermissionsBuilder {
		return this.allow([Acl.Operation.create, Acl.Operation.read, Acl.Operation.update], predicate)
	}

	public allow(
		operations: (Acl.Operation.create | Acl.Operation.read | Acl.Operation.update)[],
		predicate: Acl.Predicate = true,
	): FieldPermissionsBuilder {
		const permissions: Writable<Acl.Permissions> = {}
		for (const [entity, field] of this.fields) {
			if (!permissions[entity.name]) {
				permissions[entity.name] = { operations: {}, predicates: {} }
			}
			const entityOperations: Writable<Acl.EntityOperations> = permissions[entity.name].operations
			for (const op of operations) {
				entityOperations[op] = {
					...(permissions[entity.name].operations[op] || {}),
					[field.name]: predicate,
				}
			}
		}
		return new FieldPermissionsBuilder(this.entityPermissionsBuilder.add(permissions), this.fields)
	}

	public onEntity(entitySelector: EntitySelector | string | string[]): EntityPermissionsBuilder {
		return this.entityPermissionsBuilder.onEntity(entitySelector)
	}

	public onEveryEntity(): EntityPermissionsBuilder {
		return this.entityPermissionsBuilder.onEveryEntity()
	}

	public onField(fieldSelector: FieldSelector | string | string[]) {
		return this.entityPermissionsBuilder.onField(fieldSelector)
	}

	public onEveryField(): FieldPermissionsBuilder {
		return this.entityPermissionsBuilder.onEveryField()
	}
}
