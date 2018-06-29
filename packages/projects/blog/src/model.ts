export interface Entity
{
  name: string
  pluralName?: string
  primary: string
  tableName: string
  fields: { [name: string]: Column | Relation }
}

export interface Column
{
  name: string
  type: Type
  columnName: string
  unique?: boolean
  nullable?: boolean
  options?: {
    [name: string]: any,
  }
}

export const isColumn = (obj: Column | Relation): obj is Column => {
  return (obj as Column).type !== undefined
}

export const isRelation = (obj: Column | Relation): obj is Relation => {
  return (obj as Relation).relation !== undefined
}

export const getEntity = (schema: Schema, entityName: string): Entity => {
  return schema.entities[entityName]
}

export const acceptFieldVisitor = <T>(schema: Schema, entity: string | Entity, fieldName: string, visitor: FieldVisitor<T>): T => {
  let entityObj: Entity = typeof entity === 'string' ? getEntity(schema, entity) : entity
  if (!entityObj) {
    throw new Error(`entity ${entity} not found`)
  }
  const field = entityObj.fields[fieldName]
  if (!field) {
    throw new Error(`field ${fieldName} of entity ${entityObj.name} not found`)
  }
  if (isColumn(field)) {
    return visitor.visitColumn(entityObj, field)
  }
  if (!isRelation(field)) {
    throw new Error()
  }
  const targetEntity = getEntity(schema, field.target)

  if ((<T>(visitor: FieldVisitor<T>): visitor is (ColumnVisitor<T> & RelationVisitor<T>) =>
    typeof (visitor as RelationVisitor<T>).visitRelation !== "undefined")(visitor)) {
    let targetRelation = null
    if (isOwnerRelation(field)) {
      targetRelation = field.inversedBy ? (targetEntity.fields[field.inversedBy] || null) : null
    } else if (isInversedRelation(field)) {
      targetRelation = targetEntity.fields[field.ownedBy]
    } else {
      throw new Error()
    }
    if (targetRelation && !isRelation(targetRelation)) {
      throw new Error()
    }
    return visitor.visitRelation(entityObj, field, targetEntity, targetRelation)
  }
  if ((<T>(visitor: FieldVisitor<T>): visitor is (ColumnVisitor<T> & RelationByGenericTypeVisitor<T>) =>
    typeof (visitor as RelationByGenericTypeVisitor<T>).visitHasMany !== "undefined")(visitor)) {

    return acceptRelationTypeVisitor(schema, entityObj, fieldName, {
      visitManyHasManyInversed: visitor.visitHasMany,
      visitManyHasManyOwner: visitor.visitHasMany,
      visitOneHasMany: visitor.visitHasMany,
      visitOneHasOneInversed: visitor.visitHasOne,
      visitOneHasOneOwner: visitor.visitHasOne,
      visitManyHasOne: visitor.visitHasOne,
    })
  }
  if ((<T>(visitor: FieldVisitor<T>): visitor is (ColumnVisitor<T> & RelationByTypeVisitor<T>) =>
    typeof (visitor as RelationByTypeVisitor<T>).visitManyHasManyInversed !== "undefined")(visitor)) {

    return acceptRelationTypeVisitor(schema, entityObj, fieldName, visitor)
  }
  throw new Error()
}


export const acceptRelationTypeVisitor = <T>(schema: Schema, entity: string | Entity, relationName: string, visitor: RelationByTypeVisitor<T>): T => {
  let entityObj: Entity = typeof entity === 'string' ? getEntity(schema, entity) : entity
  if (!entityObj) {
    throw new Error(`entity ${entity} not found`)
  }
  const relation = entityObj.fields[relationName]
  if (!relation) {
    throw new Error(`relation ${relationName} of entity ${entityObj.name} not found`)
  }
  if (!isRelation(relation)) {
    throw new Error(`field ${relationName} is not a relation`)
  }
  const targetEntity = getEntity(schema, relation.target)

  if (isInversedRelation(relation)) {
    const targetRelation = targetEntity.fields[relation.ownedBy]
    if (!isRelation(targetRelation)) {
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


export interface ColumnVisitor<T>
{
  visitColumn(entity: Entity, column: Column): T
}

export interface RelationVisitor<T>
{
  visitRelation(entity: Entity, relation: Relation, targetEntity: Entity, targetRelation: Relation | null): T
}

export type FieldVisitor<T> = ColumnVisitor<T> & (RelationVisitor<T> | RelationByTypeVisitor<T> | RelationByGenericTypeVisitor<T>)

export interface RelationByTypeVisitor<T>
{
  visitManyHasOne(entity: Entity, relation: ManyHasOneRelation, targetEntity: Entity, targetRelation: OneHasManyRelation | null): T

  visitOneHasMany(entity: Entity, relation: OneHasManyRelation, targetEntity: Entity, targetRelation: ManyHasOneRelation): T

  visitOneHasOneOwner(entity: Entity, relation: OneHasOneOwnerRelation, targetEntity: Entity, targetRelation: OneHasOneInversedRelation | null): T

  visitOneHasOneInversed(entity: Entity, relation: OneHasOneInversedRelation, targetEntity: Entity, targetRelation: OneHasOneOwnerRelation): T

  visitManyHasManyOwner(entity: Entity, relation: ManyHasManyOwnerRelation, targetEntity: Entity, targetRelation: ManyHasManyInversedRelation | null): T

  visitManyHasManyInversed(entity: Entity, relation: ManyHasManyInversedRelation, targetEntity: Entity, targetRelation: ManyHasManyOwnerRelation): T
}

export interface RelationByGenericTypeVisitor<T>
{
  visitHasMany(entity: Entity, relation: Relation, targetEntity: Entity, targetRelation: Relation | null): T

  visitHasOne(entity: Entity, relation: Relation & NullableRelation, targetEntity: Entity, targetRelation: Relation | null): T
}

export enum RelationType
{
  OneHasOne = 'OneHasOne',
  OneHasMany = 'OneHasMany',
  ManyHasOne = 'ManyHasOne',
  ManyHasMany = 'ManyHasMany',
}

export interface Relation<T extends RelationType = RelationType>
{
  name: string
  relation: T
  target: string
}

interface InversedRelation extends Relation
{
  ownedBy: string
}

export const isInversedRelation = (relation: Relation): relation is InversedRelation => {
  return (relation as InversedRelation).ownedBy !== undefined
}

interface OwnerRelation extends Relation
{
  inversedBy?: string
}

export const isOwnerRelation = (relation: Relation): relation is OwnerRelation => {
  return !isInversedRelation(relation)
}

interface JoiningColumnRelation
{
  joiningColumn: {
    columnName: string,
    onDelete: 'cascade' | 'restrict' | 'set null',
  }
}

export interface NullableRelation
{
  nullable?: boolean
}

interface JoiningTableRelation
{
  joiningTable: {
    tableName: string,
    joiningColumn: {
      columnName: string,
      onDelete: 'cascade' | 'restrict' | 'set null',
    },
    inverseJoiningColumn: {
      columnName: string,
      onDelete: 'cascade' | 'restrict' | 'set null',
    },
  }
}


export type OneHasManyRelation = Relation<RelationType.OneHasMany> & InversedRelation
export type ManyHasOneRelation = Relation<RelationType.ManyHasOne> & OwnerRelation & JoiningColumnRelation & NullableRelation
export type OneHasOneInversedRelation = Relation<RelationType.OneHasOne> & InversedRelation & NullableRelation
export type OneHasOneOwnerRelation = Relation<RelationType.OneHasOne> & OwnerRelation & JoiningColumnRelation & NullableRelation
export type ManyHasManyInversedRelation = Relation<RelationType.ManyHasMany> & InversedRelation
export type ManyHasManyOwnerRelation = Relation<RelationType.ManyHasMany> & OwnerRelation & JoiningTableRelation

export interface Schema
{
  enums: { [name: string]: string[] }
  entities: { [name: string]: Entity }
}


type Type = string

export default {
  enums: {
    siteVisibility: ['visible', 'hidden'],
    locale: ['cs', 'en'],
  },
  entities: {
    Author: {
      name: 'Author',
      primary: 'id',
      tableName: 'Author',
      fields: {
        id: {name: 'id', type: 'uuid', columnName: 'id'},
        name: {name: 'name', type: 'string', columnName: 'name'},
      }
    },
    Category: {
      name: 'Category',
      pluralName: 'Categories',
      primary: 'id',
      tableName: 'Category',
      fields: {
        id: {name: 'id', type: 'uuid', columnName: 'id'},
        locales: {name: 'locales', relation: RelationType.OneHasMany, target: 'CategoryLocale', ownedBy: 'category'},
        posts: {name: 'posts', relation: RelationType.ManyHasMany, target: 'Post', ownedBy: 'categories'},
      }
    },
    CategoryLocale: {
      name: 'CategoryLocale',
      primary: 'id',
      tableName: 'CategoryLocale',
      fields: {
        id: {name: 'id', type: 'uuid', columnName: 'id'},
        name: {name: 'name', type: 'string', columnName: 'name'},
        locale: {name: 'locale', type: 'locale', columnName: 'locale'},
        category: {
          name: 'category',
          relation: RelationType.ManyHasOne,
          target: 'Category',
          inversedBy: 'locales',
          joiningColumn: {
            columnName: 'category_id',
            onDelete: 'restrict',
          }
        },
      }
    },
    Post: {
      name: 'Post',
      primary: 'id',
      tableName: 'Post',
      fields: {
        id: {name: 'id', type: 'uuid', columnName: 'id'},
        publishedAt: {name: 'publishedAt', type: 'datetime', columnName: 'publishedAt'},
        author: {name: 'author', relation: RelationType.ManyHasOne, target: 'Author', joiningColumn: {columnName: 'author_id', onDelete: 'cascade'}},
        locales: {name: 'locales', relation: RelationType.OneHasMany, target: 'PostLocale', ownedBy: 'post'},
        sites: {name: 'sites', relation: RelationType.OneHasMany, target: 'PostSite', ownedBy: 'post'},
        categories: {
          name: 'categories',
          relation: RelationType.ManyHasMany,
          target: 'Category',
          inversedBy: 'posts',
          joiningTable: {
            tableName: 'PostCategories',
            joiningColumn: {
              columnName: 'post_id',
              onDelete: 'cascade'
            },
            inverseJoiningColumn: {
              columnName: 'category_id',
              onDelete: 'cascade'
            }
          }
        },
      }
    },
    PostLocale: {
      name: 'PostLocale',
      primary: 'id',
      tableName: 'PostLocale',
      fields: {
        id: {name: 'id', type: 'uuid', columnName: 'id'},
        post: {
          name: 'post',
          relation: RelationType.ManyHasOne,
          target: 'Post',
          joiningColumn: {
            columnName: 'post_id',
            onDelete: 'cascade',
          }
        },
        locale: {name: 'locale', type: 'locale', columnName: 'locale'},
        title: {name: 'title', type: 'string', columnName: 'title'},
      }
    },
    PostSite: {
      name: 'PostSite',
      primary: 'id',
      tableName: 'PostSite',
      fields: {
        id: {name: 'id', type: 'uuid', columnName: 'id'},
        post: {
          name: 'post',
          relation: RelationType.ManyHasOne,
          target: 'Post',
          joiningColumn: {
            columnName: 'post_id',
            onDelete: 'cascade',
          }
        },
        site: {
          name: 'site',
          relation: RelationType.ManyHasOne,
          target: 'Site',
          joiningColumn: {
            columnName: 'site_id',
            onDelete: 'cascade'
          }
        },
        visibility: {name: 'visibility', type: 'siteVisibility', columnName: 'visibility'},
      }
    },
    Site: {
      name: 'Site',
      primary: 'id',
      tableName: 'Site',
      fields: {
        id: {name: 'id', type: 'uuid', columnName: 'id'},
        name: {name: 'name', type: 'string', columnName: 'name'},
      },
    }
  }
} as Schema
