import { Acl, Model, Schema } from '@contember/schema'

type Updater<T> = (value: T) => T
export type SchemaUpdater = Updater<Schema>
type ModelUpdater = Updater<Model.Schema>
export type EntityUpdater = Updater<Model.Entity>
type FieldUpdater<T extends Model.AnyField> = (field: T, entity: Model.Entity) => Model.AnyField

type AclUpdater = Updater<Acl.Schema>
type AclRoleUpdater = Updater<Acl.RolePermissions>
const noopUpdater = <T>(value: T): T => value

export const updateSchema = (...schemaUpdater: (SchemaUpdater | undefined)[]): SchemaUpdater => schema =>
	schemaUpdater.reduce((acc, updater) => (updater || noopUpdater)(acc), schema)

export const updateAcl = (updater: AclUpdater): SchemaUpdater => schema => ({
	...schema,
	acl: updater(schema.acl),
})

export const updateAclEveryRole = (...updater: AclRoleUpdater[]): AclUpdater => acl => ({
	...acl,
	roles: Object.fromEntries(
		updater.reduce((acc, updater) => acc.map(([name, role]) => [name, updater(role)]), Object.entries(acl.roles)),
	),
})

export const updateAclEntities = (updater: Updater<Acl.Permissions>): AclRoleUpdater => role => ({
	...role,
	entities: updater(role.entities),
})

type EntityPermissionsUpdater = (entityPermissions: Acl.EntityPermissions, entityName: string) => Acl.EntityPermissions
export const updateAclEveryEntity = (...updater: EntityPermissionsUpdater[]): AclRoleUpdater => permissions => ({
	...permissions,
	entities: Object.fromEntries(
		updater.reduce(
			(acc, updater) => acc.map(([entity, entityPermissions]) => [entity, updater(entityPermissions, entity)]),
			Object.entries(permissions.entities),
		),
	),
})

type EntityAclFieldPermissionsUpdater = (
	fieldPermissions: Acl.FieldPermissions,
	entityName: string,
	operation: Acl.Operation,
) => Acl.FieldPermissions

export const updateAclFieldPermissions = (updater: EntityAclFieldPermissionsUpdater): EntityPermissionsUpdater => (
	entityPermissions,
	entityName,
) => {
	const operations: Acl.EntityOperations = {}
	if (entityPermissions.operations.create) {
		operations.create = updater(entityPermissions.operations.create, entityName, Acl.Operation.create)
	}
	if (entityPermissions.operations.update) {
		operations.update = updater(entityPermissions.operations.update, entityName, Acl.Operation.update)
	}
	if (entityPermissions.operations.read) {
		operations.read = updater(entityPermissions.operations.read, entityName, Acl.Operation.read)
	}
	if ('delete' in entityPermissions.operations) {
		operations.delete = entityPermissions.operations.delete
	}
	return {
		...entityPermissions,
		operations,
	}
}

type EntityAclEveryPredicatesUpdater = (
	predicate: Acl.PredicateDefinition,
	entityName: string,
) => Acl.PredicateDefinition
export const updateAclEveryPredicate = (updater: EntityAclEveryPredicatesUpdater): EntityPermissionsUpdater => (
	permissions,
	entityName,
) => {
	return {
		...permissions,
		predicates: Object.fromEntries(
			Object.entries(permissions.predicates).map(([name, predicate]) => [name, updater(predicate, entityName)]),
		),
	}
}

export const updateModel = (...modelUpdate: (ModelUpdater | undefined)[]): SchemaUpdater => schema => ({
	...schema,
	model: modelUpdate
		.filter((it): it is ModelUpdater => it !== undefined)
		.reduce((model, updater) => updater(model), schema.model),
})

export const updateEntity = (name: string, entityUpdate: EntityUpdater): ModelUpdater => model => ({
	...model,
	entities: {
		...model.entities,
		[name]: entityUpdate(model.entities[name]),
	},
})

export const updateEveryEntity = (entityUpdate: EntityUpdater): ModelUpdater => model => ({
	...model,
	entities: Object.fromEntries(Object.entries(model.entities).map(([name, entity]) => [name, entityUpdate(entity)])),
})

export const updateField = <T extends Model.AnyField = Model.AnyField>(
	name: string,
	fieldUpdater: FieldUpdater<T>,
): EntityUpdater => entity => ({
	...entity,
	fields: {
		...entity.fields,
		[name]: fieldUpdater(entity.fields[name] as T, entity),
	},
})

export const updateEveryField = (fieldUpdater: FieldUpdater<Model.AnyField>): EntityUpdater => entity => ({
	...entity,
	fields: Object.fromEntries(Object.entries(entity.fields).map(([name, field]) => [name, fieldUpdater(field, entity)])),
})

export const addField = (field: Model.AnyField): EntityUpdater => entity => ({
	...entity,
	fields: {
		...entity.fields,
		[field.name]: field,
	},
})
