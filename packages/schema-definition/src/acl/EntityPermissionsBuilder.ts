import { tuple } from '../utils'
import EntitySelector from './EntitySelector'
import { Acl, Model } from '@contember/schema'
import FieldSelector from './FieldSelector'
import FieldPermissionsBuilder from './FieldPermissionsBuilder'
import PermissionsBuilder from './PermissionsBuilder'
import PredicateReference, { resolvePredicateReference } from './PredicateReference'

export default class EntityPermissionsBuilder {
	public constructor(public readonly builder: PermissionsBuilder, private readonly entities: Model.Entity[]) {}

	get schema(): Model.Schema {
		return this.builder.schema
	}

	get permissions(): Acl.Permissions {
		return this.builder.permissions
	}

	addPredicate(name: string, predicate: Acl.PredicateDefinition<PredicateReference>): EntityPermissionsBuilder {
		const predicates = this.entities.reduce<Acl.Permissions>(
			(acc, entity) => ({
				...acc,
				[entity.name]: {
					operations: {},
					predicates: { [name]: resolvePredicateReference(this.schema, this.permissions, entity, predicate) },
				},
			}),
			{},
		)

		return this.add(predicates)
	}

	allow(operations: Acl.Operation[], predicate: Acl.Predicate = true): EntityPermissionsBuilder {
		return this.updateAll(operations, predicate)
	}

	allowAll(predicate: Acl.Predicate = true): EntityPermissionsBuilder {
		return this.updateAll(
			[Acl.Operation.read, Acl.Operation.create, Acl.Operation.update, Acl.Operation.delete],
			predicate,
		)
	}

	allowOnlyRead(predicate: Acl.Predicate = true): EntityPermissionsBuilder {
		return this.disallowAll().allow([Acl.Operation.read], predicate)
	}

	disallowAll(): EntityPermissionsBuilder {
		return this.updateAll([Acl.Operation.read, Acl.Operation.create, Acl.Operation.update, Acl.Operation.delete], false)
	}

	allowDelete(predicate: Acl.Predicate = true): EntityPermissionsBuilder {
		return this.addEntityPermission(() => ({ operations: { delete: predicate }, predicates: {} }))
	}

	allowCustomPrimary(): EntityPermissionsBuilder {
		return this.addEntityPermission(() => ({ operations: { customPrimary: true }, predicates: {} }))
	}

	private updateAll(operations: Acl.Operation[], predicate: Acl.Predicate): EntityPermissionsBuilder {
		return this.addEntityPermission(entity => {
			const fieldPermissions = Object.keys(entity.fields).reduce(
				(permissions: Acl.FieldPermissions, fieldName): Acl.FieldPermissions => {
					return { ...permissions, [fieldName]: predicate }
				},
				{},
			)
			const entityOperations: Acl.EntityOperations = {}
			if (operations.includes(Acl.Operation.read)) {
				entityOperations.read = fieldPermissions
			}
			if (operations.includes(Acl.Operation.create)) {
				entityOperations.create = fieldPermissions
			}
			if (operations.includes(Acl.Operation.update)) {
				entityOperations.update = fieldPermissions
			}
			if (operations.includes(Acl.Operation.delete)) {
				entityOperations.delete = predicate
			}
			return {
				operations: entityOperations,
				predicates: {},
			}
		})
	}

	private addEntityPermission(
		entityPermission: (entity: Model.Entity) => Acl.EntityPermissions,
	): EntityPermissionsBuilder {
		const permissions = this.entities.reduce<Acl.Permissions>(
			(acc, entity) => ({ ...acc, [entity.name]: entityPermission(entity) }),
			{},
		)
		return this.add(permissions)
	}

	public add(permissions: Acl.Permissions): EntityPermissionsBuilder {
		return new EntityPermissionsBuilder(this.builder.add(permissions), this.entities)
	}

	public onEntity(entitySelector: EntitySelector | string | string[]): EntityPermissionsBuilder {
		return this.builder.onEntity(entitySelector)
	}

	public onEveryEntity(): EntityPermissionsBuilder {
		return this.builder.onEveryEntity()
	}

	onField(fieldSelector: FieldSelector | string | string[]): FieldPermissionsBuilder {
		if (typeof fieldSelector === 'string') {
			fieldSelector = FieldSelector.named(fieldSelector)
		} else if (Array.isArray(fieldSelector)) {
			fieldSelector = FieldSelector.named(...fieldSelector)
		}
		const fieldSelectorConst = fieldSelector
		const fields = this.entities
			.map(it =>
				tuple(
					it,
					Object.values(it.fields).filter(field => fieldSelectorConst.matches(this.schema, it, field)),
				),
			)
			.reduce<[Model.Entity, Model.AnyField][]>(
				(acc, [entity, fields]) => [...acc, ...fields.map(it => tuple(entity, it))],
				[],
			)
		return new FieldPermissionsBuilder(this, fields)
	}

	onEveryField(): FieldPermissionsBuilder {
		return this.onField(FieldSelector.every())
	}
}
