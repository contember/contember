export interface Entity
{
  primary: string
  tableName: string
  fields: { [name: string]: Field | Relation }
}

export interface Field
{
  type: Type
  columnName: string
  unique?: boolean
  nullable?: boolean
  options?: {
    [name: string]: any,
  }
}

export const isField = (obj: Field | Relation): obj is Field => {
  return (obj as Field).type !== undefined
}

export type Relation = HasManyRelation | HasOneOwnerRelation | ManyHasManyOwnerRelation

export const isRelation = (obj: Field | Relation): obj is Relation => {
  return (obj as Relation).relation !== undefined
}

export const isHasOneOwnerRelation = (obj: Relation): obj is HasOneOwnerRelation => {
  return (obj as HasOneOwnerRelation).joiningColumn !== undefined
}

export const isManyHasManyOwnerRelation = (obj: Relation): obj is ManyHasManyOwnerRelation => {
  return (obj as ManyHasManyOwnerRelation).joiningTable !== undefined
}

export const isHasManyInversedRelation = (obj: Relation): obj is HasManyRelation => {
  return obj.relation === 'many' && (obj as HasManyRelation).ownedBy !== undefined
}

export const getEntity = (schema: Schema, entityName: string): Entity => {
  return schema.entities[entityName];
}

export const getField = (schema: Schema, entityName: string, fieldName: string): Field | Relation => {
  return getEntity(schema, entityName).fields[fieldName];
}

export const getRelation = (schema: Schema, entityName: string, fieldName: string): Relation => {
  const relation = getField(schema, entityName, fieldName)
  if (!isRelation(relation)) {
    throw new Error()
  }
  return relation
}

interface HasManyRelation
{
  relation: 'many'
  target: string
  ownedBy: string
}

interface HasOneOwnerRelation
{
  relation: 'one'
  nullable?: boolean,
  joiningColumn: {
    columnName: string,
    onDelete: 'cascade' | 'restrict' | 'set null',
  }
  target: string
  inversedBy?: string
}

interface ManyHasManyOwnerRelation
{
  relation: 'many'
  target: string
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
  inversedBy: string
}

export interface Schema
{
  enums: { [name: string]: string[] }
  entities: { [name: string]: Entity }
}


type Type = string;

export default {
  enums: {
    siteVisibility: ['visible', 'hidden'],
    locale: ['cs', 'en'],
  },
  entities: {
    Author: {
      primary: 'id',
      tableName: 'Author',
      fields: {
        id: {type: 'uuid', columnName: 'id'},
        name: {type: 'string', columnName: 'name'},
      }
    },
    Category: {
      primary: 'id',
      tableName: 'Category',
      fields: {
        id: {type: 'uuid', columnName: 'id'},
        locales: {relation: 'many', target: 'CategoryLocale', ownedBy: 'category'},
        posts: {relation: 'many', target: 'Post', ownedBy: 'categories'},
      }
    },
    CategoryLocale: {
      primary: 'id',
      tableName: 'CategoryLocale',
      fields: {
        id: {type: 'uuid', columnName: 'id'},
        name: {type: 'string', columnName: 'name'},
        locale: {type: 'locale', columnName: 'locale'},
        category: {
          relation: 'one', target: 'Category', inversedBy: 'locales', joiningColumn: {
            columnName: 'category_id',
            onDelete: 'restrict',
          }
        },
      }
    },
    Post: {
      primary: 'id',
      tableName: 'Post',
      fields: {
        id: {type: 'uuid', columnName: 'id'},
        publishedAt: {type: 'datetime', columnName: 'publishedAt'},
        author: {relation: 'one', target: 'Author', joiningColumn: {columnName: 'author_id', onDelete: 'cascade'}},
        locales: {relation: 'many', target: 'PostLocale', ownedBy: 'post'},
        sites: {relation: 'many', target: 'PostSite', ownedBy: 'post'},
        categories: {
          relation: 'many', target: 'Category', inversedBy: 'posts', joiningTable: {
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
      primary: 'id',
      tableName: 'PostLocale',
      fields: {
        id: {type: 'uuid', columnName: 'id'},
        post: {
          relation: 'one', target: 'Post', joiningColumn: {
            columnName: 'post_id',
            onDelete: 'cascade',
          }
        },
        locale: {type: 'locale', columnName: 'locale'},
        title: {type: 'string', columnName: 'title'},
      }
    },
    PostSite: {
      primary: 'id',
      tableName: 'PostSite',
      fields: {
        id: {type: 'uuid', columnName: 'id'},
        post: {
          relation: 'one', target: 'Post', joiningColumn: {
            columnName: 'post_id',
            onDelete: 'cascade',
          }
        },
        site: {
          relation: 'one', target: 'Site', joiningColumn: {
            columnName: 'site_id',
            onDelete: 'cascade'
          }
        },
        visibility: {type: 'siteVisibility', columnName: 'visibility'},
      }
    },
    Site: {
      primary: 'id',
      tableName: 'Site',
      fields: {
        id: {type: 'uuid', columnName: 'id'},
        name: {type: 'string', columnName: 'name'},
      },
    }
  }
} as Schema
