import { isIt } from "../utils/type"
import { Model } from "cms-common"

export const getEntity = (schema: Model.Schema, entityName: string): Model.Entity => {
  return schema.entities[entityName]
}

export const getColumnName = (schema: Model.Schema, entity: Model.Entity, fieldName: string) => {
  return acceptFieldVisitor(schema, entity, fieldName, {
    visitColumn: (entity, column) => column.name,
    visitRelation: (entity, relation) => {
      if (isIt<Model.JoiningColumnRelation>(relation, "joiningColumn")) {
        return relation.joiningColumn.columnName
      }
      throw new Error("Not an owning side")
    }
  })
}

export const acceptEveryFieldVisitor = <T>(schema: Model.Schema, entity: string | Model.Entity, visitor: Model.FieldVisitor<T>): { [fieldName: string]: T } => {
  const entityObj: Model.Entity = typeof entity === "string" ? getEntity(schema, entity) : entity
  if (!entityObj) {
    throw new Error(`entity ${entity} not found`)
  }
  const result: { [fieldName: string]: T } = {}
  for (const field in entityObj.fields) {
    result[field] = acceptFieldVisitor(schema, entityObj, field, visitor)
  }
  return result
}

export const acceptFieldVisitor = <T>(schema: Model.Schema, entity: string | Model.Entity, fieldName: string, visitor: Model.FieldVisitor<T>): T => {
  const entityObj: Model.Entity = typeof entity === "string" ? getEntity(schema, entity) : entity
  if (!entityObj) {
    throw new Error(`entity ${entity} not found`)
  }
  const field = entityObj.fields[fieldName]
  if (!field) {
    throw new Error(`field ${fieldName} of entity ${entityObj.name} not found`)
  }
  if (isIt<Model.AnyColumn>(field, "columnType")) {
    return visitor.visitColumn(entityObj, field)
  }
  if (!isIt<Model.AnyRelation>(field, "target")) {
    throw new Error()
  }
  const targetEntity = getEntity(schema, field.target)

  if (isIt<Model.ColumnVisitor<T> & Model.RelationVisitor<T>>(visitor, "visitRelation")) {
    let targetRelation = null
    if (isOwnerRelation(field)) {
      targetRelation = field.inversedBy ? (targetEntity.fields[field.inversedBy] || null) : null
    } else if (isInversedRelation(field)) {
      targetRelation = targetEntity.fields[field.ownedBy]
    } else {
      throw new Error()
    }
    if (targetRelation && !isIt<Model.Relation>(targetRelation, "target")) {
      throw new Error()
    }
    return visitor.visitRelation(entityObj, field, targetEntity, targetRelation)
  }

  if (isIt<Model.ColumnVisitor<T> & Model.RelationByGenericTypeVisitor<T>>(visitor, "visitHasMany")) {
    return acceptRelationTypeVisitor(schema, entityObj, fieldName, {
      visitManyHasManyInversed: visitor.visitHasMany.bind(visitor),
      visitManyHasManyOwner: visitor.visitHasMany.bind(visitor),
      visitOneHasMany: visitor.visitHasMany.bind(visitor),
      visitOneHasOneInversed: visitor.visitHasOne.bind(visitor),
      visitOneHasOneOwner: visitor.visitHasOne.bind(visitor),
      visitManyHasOne: visitor.visitHasOne.bind(visitor),
    })
  }

  if (isIt<Model.ColumnVisitor<T> & Model.RelationByTypeVisitor<T>>(visitor, "visitManyHasManyInversed")) {
    return acceptRelationTypeVisitor(schema, entityObj, fieldName, visitor)
  }
  throw new Error()
}

export const acceptRelationTypeVisitor = <T>(schema: Model.Schema, entity: string | Model.Entity, relationName: string, visitor: Model.RelationByTypeVisitor<T>): T => {
  const entityObj: Model.Entity = typeof entity === "string" ? getEntity(schema, entity) : entity
  if (!entityObj) {
    throw new Error(`entity ${entity} not found`)
  }
  const relation = entityObj.fields[relationName]
  if (!relation) {
    throw new Error(`relation ${relationName} of entity ${entityObj.name} not found`)
  }
  if (!isIt<Model.Relation>(relation, "target")) {
    throw new Error(`field ${relationName} is not a relation`)
  }
  const targetEntity = getEntity(schema, relation.target)

  if (isInversedRelation(relation)) {
    const targetRelation = targetEntity.fields[relation.ownedBy]
    if (!isIt<Model.Relation>(targetRelation, "target")) {
      throw new Error()
    }
    switch (relation.type) {
      case Model.RelationType.ManyHasMany:
        return visitor.visitManyHasManyInversed(entityObj, relation as Model.ManyHasManyInversedRelation, targetEntity, targetRelation as Model.ManyHasManyOwnerRelation)
      case Model.RelationType.OneHasOne:
        return visitor.visitOneHasOneInversed(entityObj, relation as Model.OneHasOneInversedRelation, targetEntity, targetRelation as Model.OneHasOneOwnerRelation)
      case Model.RelationType.OneHasMany:
        return visitor.visitOneHasMany(entityObj, relation as Model.OneHasManyRelation, targetEntity, targetRelation as Model.ManyHasOneRelation)
    }
    throw new Error()
  } else if (isOwnerRelation(relation)) {
    const targetRelation = relation.inversedBy ? targetEntity.fields[relation.inversedBy] : null

    switch (relation.type) {
      case Model.RelationType.ManyHasMany:
        return visitor.visitManyHasManyOwner(entityObj, relation as Model.ManyHasManyOwnerRelation, targetEntity, targetRelation as Model.ManyHasManyInversedRelation)
      case Model.RelationType.OneHasOne:
        return visitor.visitOneHasOneOwner(entityObj, relation as Model.OneHasOneOwnerRelation, targetEntity, targetRelation as Model.OneHasOneInversedRelation)
      case Model.RelationType.ManyHasOne:
        return visitor.visitManyHasOne(entityObj, relation as Model.ManyHasOneRelation, targetEntity, targetRelation as Model.OneHasManyRelation)
    }
    throw new Error()
  }

  throw new Error()
}

const isInversedRelation = (relation: Model.Relation): relation is Model.InversedRelation => {
  return (relation as Model.InversedRelation).ownedBy !== undefined
}

const isOwnerRelation = (relation: Model.Relation): relation is Model.OwnerRelation => {
  return !isInversedRelation(relation)
}
