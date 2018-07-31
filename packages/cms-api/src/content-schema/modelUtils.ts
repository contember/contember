import { isIt } from "../utils/type"
import {
  Column,
  ColumnVisitor,
  Entity,
  FieldVisitor,
  InversedRelation,
  JoiningColumnRelation,
  ManyHasManyInversedRelation,
  ManyHasManyOwnerRelation,
  ManyHasOneRelation,
  OneHasManyRelation,
  OneHasOneInversedRelation,
  OneHasOneOwnerRelation,
  OwnerRelation,
  Relation,
  RelationByGenericTypeVisitor,
  RelationByTypeVisitor,
  RelationType,
  RelationVisitor,
  Schema
} from "./model"

export const getEntity = (schema: Schema, entityName: string): Entity => {
  return schema.entities[entityName]
}

export const getColumnName = (schema: Schema, entity: Entity, fieldName: string) => {
  return acceptFieldVisitor(schema, entity, fieldName, {
    visitColumn: (entity, column) => column.name,
    visitRelation: (entity, relation) => {
      if (isIt<JoiningColumnRelation>(relation, "joiningColumn")) {
        return relation.joiningColumn.columnName
      }
      throw new Error("Not an owning side")
    }
  })
}

export const acceptEveryFieldVisitor = <T>(schema: Schema, entity: string | Entity, visitor: FieldVisitor<T>): { [fieldName: string]: T } => {
  const entityObj: Entity = typeof entity === "string" ? getEntity(schema, entity) : entity
  if (!entityObj) {
    throw new Error(`entity ${entity} not found`)
  }
  const result: { [fieldName: string]: T } = {}
  for (const field in entityObj.fields) {
    result[field] = acceptFieldVisitor(schema, entityObj, field, visitor)
  }
  return result
}

export const acceptFieldVisitor = <T>(schema: Schema, entity: string | Entity, fieldName: string, visitor: FieldVisitor<T>): T => {
  const entityObj: Entity = typeof entity === "string" ? getEntity(schema, entity) : entity
  if (!entityObj) {
    throw new Error(`entity ${entity} not found`)
  }
  const field = entityObj.fields[fieldName]
  if (!field) {
    throw new Error(`field ${fieldName} of entity ${entityObj.name} not found`)
  }
  if (isIt<Column>(field, "type")) {
    return visitor.visitColumn(entityObj, field)
  }
  if (!isIt<Relation>(field, "target")) {
    throw new Error()
  }
  const targetEntity = getEntity(schema, field.target)

  if (isIt<ColumnVisitor<T> & RelationVisitor<T>>(visitor, "visitRelation")) {
    let targetRelation = null
    if (isOwnerRelation(field)) {
      targetRelation = field.inversedBy ? (targetEntity.fields[field.inversedBy] || null) : null
    } else if (isInversedRelation(field)) {
      targetRelation = targetEntity.fields[field.ownedBy]
    } else {
      throw new Error()
    }
    if (targetRelation && !isIt<Relation>(targetRelation, "target")) {
      throw new Error()
    }
    return visitor.visitRelation(entityObj, field, targetEntity, targetRelation)
  }

  if (isIt<ColumnVisitor<T> & RelationByGenericTypeVisitor<T>>(visitor, "visitHasMany")) {
    return acceptRelationTypeVisitor(schema, entityObj, fieldName, {
      visitManyHasManyInversed: visitor.visitHasMany.bind(visitor),
      visitManyHasManyOwner: visitor.visitHasMany.bind(visitor),
      visitOneHasMany: visitor.visitHasMany.bind(visitor),
      visitOneHasOneInversed: visitor.visitHasOne.bind(visitor),
      visitOneHasOneOwner: visitor.visitHasOne.bind(visitor),
      visitManyHasOne: visitor.visitHasOne.bind(visitor),
    })
  }

  if (isIt<ColumnVisitor<T> & RelationByTypeVisitor<T>>(visitor, "visitManyHasManyInversed")) {
    return acceptRelationTypeVisitor(schema, entityObj, fieldName, visitor)
  }
  throw new Error()
}

export const acceptRelationTypeVisitor = <T>(schema: Schema, entity: string | Entity, relationName: string, visitor: RelationByTypeVisitor<T>): T => {
  const entityObj: Entity = typeof entity === "string" ? getEntity(schema, entity) : entity
  if (!entityObj) {
    throw new Error(`entity ${entity} not found`)
  }
  const relation = entityObj.fields[relationName]
  if (!relation) {
    throw new Error(`relation ${relationName} of entity ${entityObj.name} not found`)
  }
  if (!isIt<Relation>(relation, "target")) {
    throw new Error(`field ${relationName} is not a relation`)
  }
  const targetEntity = getEntity(schema, relation.target)

  if (isInversedRelation(relation)) {
    const targetRelation = targetEntity.fields[relation.ownedBy]
    if (!isIt<Relation>(targetRelation, "target")) {
      throw new Error()
    }
    switch (relation.relation) {
      case RelationType.ManyHasMany:
        return visitor.visitManyHasManyInversed(entityObj, relation as ManyHasManyInversedRelation, targetEntity, targetRelation as ManyHasManyOwnerRelation)
      case RelationType.OneHasOne:
        return visitor.visitOneHasOneInversed(entityObj, relation as OneHasOneInversedRelation, targetEntity, targetRelation as OneHasOneOwnerRelation)
      case RelationType.OneHasMany:
        return visitor.visitOneHasMany(entityObj, relation as OneHasManyRelation, targetEntity, targetRelation as ManyHasOneRelation)
    }
    throw new Error()
  } else if (isOwnerRelation(relation)) {
    const targetRelation = relation.inversedBy ? targetEntity.fields[relation.inversedBy] : null

    switch (relation.relation) {
      case RelationType.ManyHasMany:
        return visitor.visitManyHasManyOwner(entityObj, relation as ManyHasManyOwnerRelation, targetEntity, targetRelation as ManyHasManyInversedRelation)
      case RelationType.OneHasOne:
        return visitor.visitOneHasOneOwner(entityObj, relation as OneHasOneOwnerRelation, targetEntity, targetRelation as OneHasOneInversedRelation)
      case RelationType.ManyHasOne:
        return visitor.visitManyHasOne(entityObj, relation as ManyHasOneRelation, targetEntity, targetRelation as OneHasManyRelation)
    }
    throw new Error()
  }

  throw new Error()
}

const isInversedRelation = (relation: Relation): relation is InversedRelation => {
  return (relation as InversedRelation).ownedBy !== undefined
}

const isOwnerRelation = (relation: Relation): relation is OwnerRelation => {
  return !isInversedRelation(relation)
}
