import { Acl, Input, Model } from '@contember/schema'
import { acceptFieldVisitor, getEntity } from '@contember/schema-utils'
import { Argument, ResolverFn, TypeRef } from '@contember/graphql-json'
import { Authorizator } from '../acl/index.js'
import { FieldAccessVisitor } from '../schema/FieldAccessVisitor.js'
import { GqlTypeName } from '../schema/utils.js'
import { capitalizeFirstLetter, getFieldsForUniqueWhere } from '../utils/index.js'
import { ImplementationException } from '../exception.js'
import { HasManyToHasOneReducer } from '../extensions/hasManyToHasOneReducer/HasManyToHasOneReducer.js'
import { PaginatedHasManyFieldProvider } from '../extensions/paginatedHasMany/PaginatedHasManyFieldProvider.js'
import { JsonColumnTypes } from './JsonColumnTypes.js'
import { JsonFilterTypes } from './JsonFilterTypes.js'
import { JsonOutputField, JsonTypeRegistry, listOfNonNullRef, namedRef, nonNullListOfNonNullRef, nonNullRef, toNonNull } from './JsonTypeRegistry.js'

export const aliasAwareResolver: ResolverFn = (source, args, context, info) => {
	if (source === null || typeof source !== 'object') {
		return undefined
	}
	const key = info.path.key
	return key in source ? Reflect.get(source, key) : undefined
}

/** JSON counterpart of `EntityTypeProvider`, `PaginatedFieldConfigFactory` and the two entity field extensions. */
export class JsonEntityTypes {
	constructor(
		private readonly schema: Model.Schema,
		private readonly authorizator: Authorizator,
		private readonly rootAuthorizator: Authorizator,
		private readonly registry: JsonTypeRegistry,
		private readonly columnTypes: JsonColumnTypes,
		private readonly filterTypes: JsonFilterTypes,
	) {}

	public getEntity(entityName: string): string {
		if (this.authorizator.getEntityPermission(Acl.Operation.read, entityName) === 'no') {
			throw new ImplementationException()
		}
		return this.registry.object(GqlTypeName`${entityName}`, () => this.getEntityFields(entityName))
	}

	public getConnection(entityName: string): string {
		const entityType = this.getEntity(entityName)
		return this.registry.object(GqlTypeName`${entityName}Connection`, () => ({
			pageInfo: { type: nonNullRef(this.getPageInfo()) },
			edges: {
				type: nonNullListOfNonNullRef(
					this.registry.object(GqlTypeName`${entityName}Edge`, () => ({
						node: { type: nonNullRef(entityType) },
					})),
				),
			},
		}))
	}

	public createPaginatedField(entityName: string): Pick<JsonOutputField, 'type' | 'args'> {
		return {
			type: nonNullRef(this.getConnection(entityName)),
			args: {
				filter: [namedRef(this.filterTypes.getEntityWhereType(entityName))],
				orderBy: [listOfNonNullRef(this.filterTypes.getEntityOrderByType(entityName))],
				skip: [namedRef(this.columnTypes.getScalar(Model.ColumnType.Int))],
				first: [namedRef(this.columnTypes.getScalar(Model.ColumnType.Int))],
			},
		}
	}

	private getPageInfo(): string {
		return this.registry.object('PageInfo', () => ({
			totalCount: { type: nonNullRef(this.columnTypes.getScalar(Model.ColumnType.Int)) },
		}))
	}

	private getFieldMeta(): string {
		const boolean = namedRef(this.columnTypes.getScalar(Model.ColumnType.Bool))
		return this.registry.object('FieldMeta', () => ({
			[Input.FieldMeta.readable]: { type: boolean, resolve: aliasAwareResolver },
			[Input.FieldMeta.updatable]: { type: boolean, resolve: aliasAwareResolver },
		}))
	}

	private getEntityFields(entityName: string): Record<string, JsonOutputField> {
		const entity = getEntity(this.schema, entityName)
		const accessVisitor = new FieldAccessVisitor(Acl.Operation.read, this.authorizator)
		const accessibleFields = Object.values(entity.fields).filter(field => acceptFieldVisitor(this.schema, entity, field.name, accessVisitor))

		const fieldMeta = this.getFieldMeta()
		const metaType = this.registry.object(GqlTypeName`${entityName}Meta`, () => {
			const metaFields: Record<string, JsonOutputField> = {}
			for (const field of accessibleFields) {
				metaFields[field.name] = { type: namedRef(fieldMeta), resolve: aliasAwareResolver }
			}
			return metaFields
		})

		const fields: Record<string, JsonOutputField> = {
			_meta: { type: namedRef(metaType), resolve: aliasAwareResolver },
		}
		for (const field of accessibleFields) {
			fields[field.name] = {
				type: this.getFieldType(entity, field.name),
				args: this.getFieldArgs(entity, field.name),
				resolve: aliasAwareResolver,
			}
		}
		// same order as the registered EntityFieldsProviders of GraphQlSchemaBuilderFactory
		for (const field of accessibleFields) {
			if (field.type === Model.RelationType.OneHasMany) {
				Object.assign(fields, this.getHasManyToHasOneFields(entity, field.name))
			}
		}
		for (const field of accessibleFields) {
			Object.assign(fields, this.getPaginatedHasManyFields(entity, field.name))
		}
		return fields
	}

	private getFieldType(entity: Model.Entity, fieldName: string): TypeRef {
		return acceptFieldVisitor<TypeRef>(this.schema, entity, fieldName, {
			visitColumn: ({ column }) => {
				const { type } = this.columnTypes.getType(column)
				const fieldPredicate = this.authorizator.getFieldPredicate(Acl.Operation.read, entity.name, column.name)
				const idPredicate = this.authorizator.getFieldPredicate(Acl.Operation.read, entity.name, entity.primary)
				if (!fieldPredicate || !idPredicate) {
					throw new ImplementationException()
				}
				const alwaysReadable = this.isAlwaysReadable(this.authorizator, entity, column)
					&& this.isAlwaysReadable(this.rootAuthorizator, entity, column)
				return !column.nullable && alwaysReadable ? toNonNull(type) : type
			},
			visitHasMany: ({ relation }) => nonNullListOfNonNullRef(this.getEntity(relation.target)),
			visitHasOne: ({ relation }) => namedRef(this.getEntity(relation.target)),
		})
	}

	/** Mirrors `FieldTypeVisitor.isAlwaysReadable`. */
	private isAlwaysReadable(authorizator: Authorizator, entity: Model.Entity, column: Model.AnyColumn): boolean {
		if (authorizator.getEntityPermission(Acl.Operation.read, entity.name) === 'no') {
			return true
		}
		const fieldPredicate = authorizator.getFieldPredicate(Acl.Operation.read, entity.name, column.name)
		if (!fieldPredicate) {
			return false
		}
		return fieldPredicate === true || fieldPredicate === authorizator.getFieldPredicate(Acl.Operation.read, entity.name, entity.primary)
	}

	private getFieldArgs(entity: Model.Entity, fieldName: string): Record<string, Argument> | undefined {
		return acceptFieldVisitor<Record<string, Argument> | undefined>(this.schema, entity, fieldName, {
			visitColumn: () => undefined,
			visitHasMany: ({ relation }) => ({
				filter: [namedRef(this.filterTypes.getEntityWhereType(relation.target))],
				orderBy: [listOfNonNullRef(this.filterTypes.getEntityOrderByType(relation.target))],
				offset: [namedRef(this.columnTypes.getScalar(Model.ColumnType.Int))],
				limit: [namedRef(this.columnTypes.getScalar(Model.ColumnType.Int))],
			}),
			visitHasOne: ({ relation }) => ({
				filter: [namedRef(this.filterTypes.getEntityWhereType(relation.target))],
			}),
		})
	}

	/** Mirrors `HasManyToHasOneRelationReducerFieldVisitor.visitOneHasMany`. */
	private getHasManyToHasOneFields(entity: Model.Entity, relationName: string): Record<string, JsonOutputField> {
		const relation = entity.fields[relationName]
		if (relation.type !== Model.RelationType.OneHasMany) {
			return {}
		}
		const targetEntity = getEntity(this.schema, relation.target)
		const targetRelation = targetEntity.fields[relation.ownedBy]
		if (!targetRelation) {
			return {}
		}
		const isReadable = (fieldName: string) =>
			acceptFieldVisitor(this.schema, targetEntity.name, fieldName, new FieldAccessVisitor(Acl.Operation.read, this.authorizator))
		const uniqueConstraints = getFieldsForUniqueWhere(this.schema, targetEntity)
		const uniqueKeys = uniqueConstraints
			.map(it => it.filter(it => it !== targetRelation.name))
			.filter(it => it.length > 0)
			.filter(uniqueKey => uniqueKey.every(isReadable))

		const entityType = this.getEntity(targetEntity.name)
		const extensions = { relationName: relation.name, extensionKey: HasManyToHasOneReducer.extensionName }
		const createField = (uniqueWhereName: string, keys: (readonly string[])[]): JsonOutputField => ({
			type: namedRef(entityType),
			extensions,
			args: {
				by: [nonNullRef(this.registry.inputObject(uniqueWhereName, () => this.filterTypes.getUniqueWhereFields(targetEntity, keys)))],
				filter: [namedRef(this.filterTypes.getEntityWhereType(targetEntity.name))],
			},
			resolve: aliasAwareResolver,
		})

		const composedUnique = uniqueConstraints
			.filter(fields => fields.length === 2)
			.filter(fields => fields.includes(targetRelation.name))
			.map(fields => fields.filter(it => it !== targetRelation.name))
			.map(fields => fields[0])
		const singleUnique = uniqueConstraints
			.filter(fields => fields.length === 1 && fields[0] !== targetEntity.primary)
			.map(fields => fields[0])
			.filter(it => it !== targetRelation.name)

		const fields: Record<string, JsonOutputField> = {}
		for (const fieldName of new Set([...composedUnique, ...singleUnique].filter(isReadable))) {
			fields[relation.name + GqlTypeName`By${fieldName}`] = createField(
				GqlTypeName`${entity.name}${relation.name}By${fieldName}UniqueWhere`,
				[[fieldName]],
			)
		}
		const universalName = relation.name + 'By'
		if (!(universalName in entity.fields)) {
			fields[universalName] = createField(GqlTypeName`${relation.name}Of${entity.name}ByUniqueWhere`, uniqueKeys)
		}
		return fields
	}

	/** Mirrors `PaginatedHasManyFieldProviderVisitor`. */
	private getPaginatedHasManyFields(entity: Model.Entity, fieldName: string): Record<string, JsonOutputField> {
		const field = entity.fields[fieldName]
		if (field.type !== Model.RelationType.OneHasMany && field.type !== Model.RelationType.ManyHasMany) {
			return {}
		}
		return {
			[`paginate${capitalizeFirstLetter(field.name)}`]: {
				...this.createPaginatedField(field.target),
				extensions: { relationName: field.name, extensionKey: PaginatedHasManyFieldProvider.extensionName },
				resolve: aliasAwareResolver,
			},
		}
	}
}
