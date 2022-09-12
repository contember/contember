import { assertNever, isIt } from '../utils'
import { Model } from '@contember/schema'

export enum ModelErrorCode {
	ENTITY_NOT_FOUND = 'entityNotFound',
	FIELD_NOT_FOUND = 'fieldNotFound',
	NOT_RELATION = 'notRelation',
	NOT_OWNING_SIDE = 'notOwningSide',
}

export class ModelError extends Error {
	constructor(public readonly code: ModelErrorCode, message: string) {
		super(message)
	}
}

const createEntityNotFoundError = (entityName: string) =>
	new ModelError(ModelErrorCode.ENTITY_NOT_FOUND, `Entity ${entityName} not found`)

const createFieldNotFoundError = (entityName: string, fieldName: string) =>
	new ModelError(ModelErrorCode.FIELD_NOT_FOUND, `Field ${fieldName} of entity ${entityName} not found`)

export const getEntity = (schema: Model.Schema, entityName: string): Model.Entity => {
	const entity = schema.entities[entityName]
	if (!entity) {
		throw createEntityNotFoundError(entityName)
	}
	return entity
}

export const getField = (entity: Model.Entity, fieldName: string): Model.AnyField => {
	const field = entity.fields[fieldName]
	if (!field) {
		throw createFieldNotFoundError(entity.name, fieldName)
	}
	return field
}

export const getColumnName = (schema: Model.Schema, entity: Model.Entity, fieldName: string) => {
	return acceptFieldVisitor(schema, entity, fieldName, {
		visitColumn: ({ column }) => column.columnName,
		visitRelation: ({ entity, relation }) => {
			if (isIt<Model.JoiningColumnRelation>(relation, 'joiningColumn')) {
				return relation.joiningColumn.columnName
			}
			throw new ModelError(
				ModelErrorCode.NOT_OWNING_SIDE,
				`Field ${relation.name} of entity ${entity.name} is not an owning side`,
			)
		},
	})
}

export const tryGetColumnName = (schema: Model.Schema, entity: Model.Entity, fieldName: string) => {
	try {
		return getColumnName(schema, entity, fieldName)
	} catch (e) {
		if (e instanceof ModelError && e.code === ModelErrorCode.NOT_OWNING_SIDE) {
			return undefined
		}
		throw e
	}
}

export const getColumnType = (schema: Model.Schema, entity: Model.Entity, fieldName: string): string => {
	return acceptFieldVisitor(schema, entity, fieldName, {
		// TODO solve enum handling properly maybe we should distinguish between domain and column type
		visitColumn: ({ column }) => (column.type === Model.ColumnType.Enum ? 'text' : column.columnType),
		visitRelation: ({ entity, relation, targetEntity }) => {
			if (isIt<Model.JoiningColumnRelation>(relation, 'joiningColumn')) {
				return getColumnType(schema, targetEntity, targetEntity.primary)
			}
			throw new ModelError(
				ModelErrorCode.NOT_OWNING_SIDE,
				`Field ${relation.name} of entity ${entity.name} is not an owning side`,
			)
		},
	})
}

export const getTargetEntity = (
	schema: Model.Schema,
	entity: Model.Entity,
	relationName: string,
): Model.Entity | null => {
	return acceptFieldVisitor(schema, entity, relationName, {
		visitColumn: () => null,
		visitRelation: ({ targetEntity }) => targetEntity,
	})
}

export const acceptEveryFieldVisitor = <T>(
	schema: Model.Schema,
	entity: string | Model.Entity,
	visitor: Model.FieldVisitor<T>,
): { [fieldName: string]: T } => {
	const entityObj: Model.Entity = typeof entity === 'string' ? getEntity(schema, entity) : entity

	const result: { [fieldName: string]: T } = {}
	for (const field in entityObj.fields) {
		result[field] = acceptFieldVisitor(schema, entityObj, field, visitor)
	}
	return result
}

export const acceptFieldVisitor = <T>(
	schema: Model.Schema,
	entity: string | Model.Entity,
	field: string | Model.AnyField,
	visitor: Model.FieldVisitor<T>,
): T => {
	const entityObj: Model.Entity = typeof entity === 'string' ? getEntity(schema, entity) : entity

	const fieldObj: Model.AnyField = typeof field === 'string' ? entityObj.fields[field] : field
	if (!fieldObj) {
		throw createFieldNotFoundError(entityObj.name, typeof field === 'string' ? field : 'unknown')
	}

	if (isIt<Model.AnyColumn>(fieldObj, 'columnType')) {
		return visitor.visitColumn({
			entity: entityObj,
			column: fieldObj,
		})
	}

	if (isIt<Model.ColumnVisitor<T> & Model.RelationVisitor<T>>(visitor, 'visitRelation')) {
		return acceptRelationTypeVisitor(schema, entityObj, fieldObj, {
			visitManyHasManyInverse: visitor.visitRelation.bind(visitor),
			visitManyHasManyOwning: visitor.visitRelation.bind(visitor),
			visitOneHasMany: visitor.visitRelation.bind(visitor),
			visitOneHasOneInverse: visitor.visitRelation.bind(visitor),
			visitOneHasOneOwning: visitor.visitRelation.bind(visitor),
			visitManyHasOne: visitor.visitRelation.bind(visitor),
		})
	}

	if (isIt<Model.ColumnVisitor<T> & Model.RelationByGenericTypeVisitor<T>>(visitor, 'visitHasMany')) {
		return acceptRelationTypeVisitor(schema, entityObj, fieldObj, {
			visitManyHasManyInverse: visitor.visitHasMany.bind(visitor),
			visitManyHasManyOwning: visitor.visitHasMany.bind(visitor),
			visitOneHasMany: visitor.visitHasMany.bind(visitor),
			visitOneHasOneInverse: visitor.visitHasOne.bind(visitor),
			visitOneHasOneOwning: visitor.visitHasOne.bind(visitor),
			visitManyHasOne: visitor.visitHasOne.bind(visitor),
		})
	}

	if (isIt<Model.ColumnVisitor<T> & Model.RelationByTypeVisitor<T>>(visitor, 'visitManyHasManyInverse')) {
		return acceptRelationTypeVisitor(schema, entityObj, fieldObj, visitor)
	}

	throw new Error()
}

export const acceptRelationTypeVisitor = <T>(
	schema: Model.Schema,
	entity: string | Model.Entity,
	relation: string | Model.AnyRelation,
	visitor: Model.RelationByTypeVisitor<T>,
): T => {
	const entityObj = typeof entity === 'string' ? getEntity(schema, entity) : entity

	const relationObj: Model.AnyField = typeof relation === 'string' ? entityObj.fields[relation] : relation
	if (!relationObj) {
		throw createFieldNotFoundError(entityObj.name, typeof relation === 'string' ? relation : 'unknown')
	}

	if (!isRelation(relationObj)) {
		throw new ModelError(
			ModelErrorCode.NOT_RELATION,
			`Field ${relationObj.name} of entity ${entityObj.name} is not a relation`,
		)
	}

	const targetEntity = getEntity(schema, relationObj.target)

	if (isInverseRelation(relationObj)) {
		const targetRelation = targetEntity.fields[relationObj.ownedBy]
		switch (relationObj.type) {
			case Model.RelationType.ManyHasMany:
				return visitor.visitManyHasManyInverse({
					type: 'manyHasManyInverse',
					entity: entityObj,
					relation: relationObj,
					targetEntity: targetEntity,
					targetRelation: targetRelation as Model.ManyHasManyOwningRelation,
				},
				)
			case Model.RelationType.OneHasOne:
				return visitor.visitOneHasOneInverse({
					type: 'oneHasOneInverse',
					entity: entityObj,
					relation: relationObj,
					targetEntity: targetEntity,
					targetRelation: targetRelation as Model.OneHasOneOwningRelation,
				})
			case Model.RelationType.OneHasMany:
				return visitor.visitOneHasMany({
					type: 'oneHasMany',
					entity: entityObj,
					relation: relationObj,
					targetEntity: targetEntity,
					targetRelation: targetRelation as Model.ManyHasOneRelation,
				})
			default:
				return assertNever(relationObj)
		}
	} else if (isOwningRelation(relationObj)) {
		const targetRelation = relationObj.inversedBy ? targetEntity.fields[relationObj.inversedBy] : null

		switch (relationObj.type) {
			case Model.RelationType.ManyHasMany:
				return visitor.visitManyHasManyOwning({
					type: 'manyHasManyOwning',
					entity: entityObj,
					relation: relationObj,
					targetEntity: targetEntity,
					targetRelation: targetRelation as Model.ManyHasManyInverseRelation,
				})
			case Model.RelationType.OneHasOne:
				return visitor.visitOneHasOneOwning({
					type: 'oneHasOneOwning',
					entity: entityObj,
					relation: relationObj,
					targetEntity: targetEntity,
					targetRelation: targetRelation as Model.OneHasOneInverseRelation,
				})
			case Model.RelationType.ManyHasOne:
				return visitor.visitManyHasOne({
					type: 'manyHasOne',
					entity: entityObj, //
					relation: relationObj,
					targetEntity: targetEntity,
					targetRelation: targetRelation as Model.OneHasManyRelation,
				})
			default:
				return assertNever(relationObj)
		}
	}

	throw new Error('Invalid relation type')
}

export const isRelation = (field: Model.AnyField): field is Model.AnyRelation => {
	return isIt<Model.Relation>(field, 'target')
}

export const isInverseRelation = (relation: Model.Relation): relation is Model.InverseRelation => {
	return (relation as Model.InverseRelation).ownedBy !== undefined
}

export const isOwningRelation = (relation: Model.Relation): relation is Model.OwningRelation => {
	return !isInverseRelation(relation)
}

export const isColumn = (field: Model.AnyField): field is Model.AnyColumn => isIt<Model.AnyColumn>(field, 'columnType')

export const emptyModelSchema: Model.Schema = { entities: {}, enums: {} }
