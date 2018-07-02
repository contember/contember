import { acceptEveryFieldVisitor, acceptFieldVisitor, FieldVisitor, getEntity, Schema } from "../model";
import { GraphQLFieldConfig, GraphQLInputFieldConfig, GraphQLInputFieldConfigMap, GraphQLInputObjectType, GraphQLList, GraphQLNonNull } from "graphql";
import { getEntityType } from "./entities";
import getColumnType from "./columns";
import { getPrimaryWhereType } from "./where";
import singletonFactory from "../utils/singletonFactory";
import { capitalizeFirstLetter } from "../utils/strings";
import { Context } from "../types";
import * as uuidv4 from 'uuid/v4'
import joinMonster from "join-monster";
import * as Knex from "knex";
import { JoinMonsterFieldMapping } from "../joinMonsterHelpers";
import { escapeParameter } from "../sql/utils";

type RelationDefinition = { entityName: string, relationName: string }

const createConnectInputSingleton = singletonFactory((id: RelationDefinition, schema: Schema) => {
  return acceptFieldVisitor(schema, id.entityName, id.relationName, {
    visitColumn: () => {
      throw new Error()
    },
    visitRelation: (entity, relation, targetEntity, targetRelation) => {
      return new GraphQLInputObjectType({
        name: capitalizeFirstLetter(entity.name) + "Create" + capitalizeFirstLetter(relation.name) + "Input",
        fields: () => {
          return {
            connect: {
              type: getPrimaryWhereType(schema)(targetEntity.name)
            },
            create: {
              type: getCreateEntityInputData(schema)(targetEntity.name, targetRelation ? targetRelation.name : undefined)
            }
          }
        }
      })
    },
  })
})

const getCreateConnectInput = (schema: Schema) => (entityName: string, relationName: string) => createConnectInputSingleton({entityName, relationName}, schema)

const createEntityInputDataSingleton = singletonFactory((id: { entityName: string, withoutRelation?: string }, schema: Schema) => {

  const getBasicType = getColumnType(schema)

  const {withoutRelation, entityName} = id

  const withoutSuffix = withoutRelation ? "Without" + capitalizeFirstLetter(withoutRelation) : ''

  return new GraphQLInputObjectType({
    name: capitalizeFirstLetter(entityName) + withoutSuffix + "CreateInput",
    fields: () => {
      const fields: GraphQLInputFieldConfigMap = {}
      let entity = getEntity(schema, entityName);
      for (let fieldName in entity.fields) {
        if (withoutRelation && fieldName === withoutRelation) {
          continue
        }
        if (fieldName === entity.primary) {
          continue //todo maybe optional?
        }
        fields[fieldName] = acceptFieldVisitor(schema, entityName, fieldName, {
          visitColumn: (entity, column) => {
            const type = getBasicType(column.type)
            return {
              type: column.nullable ? type : new GraphQLNonNull(type),
            }
          },
          visitHasOne: (entity, relation) => {
            const type = getCreateConnectInput(schema)(entity.name, relation.name)
            return {
              type: relation.nullable ? type : new GraphQLNonNull(type),
            }
          },
          visitHasMany: (entity, relation) => {
            return {
              type: new GraphQLList(new GraphQLNonNull(getCreateConnectInput(schema)(entity.name, relation.name)))
            }
          },
        } as FieldVisitor<GraphQLInputFieldConfig>)
      }

      return fields
    }
  })
})

const getCreateEntityInputData = (schema: Schema) => (entityName: string, withoutRelation?: string) => createEntityInputDataSingleton({
  entityName,
  withoutRelation
}, schema)


const insertData = (schema: Schema, db: Knex) => {

  const insertRow = async (entityName: string, data: any) => {
    const entity = getEntity(schema, entityName)
    const rowData: any = {}
    const beforeInsert: PromiseLike<any>[] = []
    const afterInsert: ((id: any) => PromiseLike<any>)[] = []


    acceptEveryFieldVisitor(schema, entity, {
      visitColumn: (entity, column) => {
        if (entity.primary === column.name) {
          rowData[column.columnName] = uuidv4()
        } else {
          rowData[column.columnName] = data[column.name]
        }
      },
      visitOneHasOneOwner: (entity, relation, targetEntity) => {
        if (data[relation.name] === undefined) {
          return
        }
        if (data[relation.name].connect) {
          rowData[relation.joiningColumn.columnName] = data[relation.name].connect[targetEntity.primary]
        } else if (data[relation.name].create) {
          beforeInsert.push(insertRow(targetEntity.name, data[relation.name].create).then(returning => rowData[relation.joiningColumn.columnName] = returning[0]))
        } else {
          throw new Error() //todo better message
        }
      },
      visitOneHasOneInversed: (entity, relation, targetEntity, targetRelation) => {
        if (data[relation.name] === undefined) {
          return
        }
        if (data[relation.name].connect) {
          afterInsert.push(returning => {
            return db.table(targetEntity.tableName)
              .update(targetRelation.joiningColumn.columnName, returning[0])
              .where(targetEntity.primary, data[relation.name].connect[targetEntity.primary])
          })
        } else if (data[relation.name].create) {
          afterInsert.push(returning => {
            return insertRow(targetEntity.name, {
              ...data[relation.name].create,
              [targetRelation.name]: {connect: {[entity.primary]: returning[0]}}
            })
          })
        } else {
          throw new Error() //todo better message
        }
      },
      visitManyHasOne: (entity, relation, targetEntity, targetRelation) => {
        if (data[relation.name] === undefined) {
          return
        }
        if (data[relation.name].connect) {
          rowData[relation.joiningColumn.columnName] = data[relation.name].connect[targetEntity.primary]
        } else if (data[relation.name].create) {
          beforeInsert.push(insertRow(targetEntity.name, data[relation.name].create).then(returning => rowData[relation.joiningColumn.columnName] = returning[0]))
        } else {
          throw new Error() //todo better message
        }
      },
      visitOneHasMany: (entity, relation, targetEntity, targetRelation) => {
        if (data[relation.name] === undefined) {
          return
        }
        for (let element of data[relation.name]) {
          if (element.connect) {
            afterInsert.push(returning => {
              return db.table(targetEntity.tableName)
                .update(targetRelation.joiningColumn.columnName, returning[0])
                .where(targetEntity.primary, element.connect[targetEntity.primary])
            })
          } else if (element.create) {
            afterInsert.push(returning => {
              return insertRow(targetEntity.name, {
                ...element.create,
                [targetRelation.name]: {connect: {[entity.primary]: returning[0]}},
              })
            })
          } else {
            throw new Error() //todo better message
          }
        }
      },
      visitManyHasManyOwner: (entity, relation, targetEntity) => {
        if (data[relation.name] === undefined) {
          return
        }
        for (let element of data[relation.name]) {
          if (element.connect) {
            afterInsert.push(returning => {
              return db.table(relation.joiningTable.tableName)
                .insert({
                  [relation.joiningTable.joiningColumn.columnName]: returning[0],
                  [relation.joiningTable.inverseJoiningColumn.columnName]: element.connect[targetEntity.primary],
                })
            })
          } else if (element.create) {
            afterInsert.push(returning => {
              return insertRow(targetEntity.name, element.create)
                .then(returningInversed => {
                  return db.table(relation.joiningTable.tableName)
                    .insert({
                      [relation.joiningTable.joiningColumn.columnName]: returning[0],
                      [relation.joiningTable.inverseJoiningColumn.columnName]: returningInversed[0],
                    })
                })
            })
          } else {
            throw new Error() //todo better message
          }
        }
      },
      visitManyHasManyInversed: (entity, relation, targetEntity, targetRelation) => {
        if (data[relation.name] === undefined) {
          return
        }
        for (let element of data[relation.name]) {
          if (element.connect) {
            afterInsert.push(returning => {
              return db.table(targetRelation.joiningTable.tableName)
                .insert({
                  [targetRelation.joiningTable.inverseJoiningColumn.columnName]: returning[0],
                  [targetRelation.joiningTable.joiningColumn.columnName]: element.connect[targetEntity.primary],
                })
            })
          } else if (element.create) {
            afterInsert.push(returning => {
              return insertRow(targetEntity.name, element.create)
                .then(returningInversed => {
                  return db.table(targetRelation.joiningTable.tableName)
                    .insert({
                      [targetRelation.joiningTable.inverseJoiningColumn.columnName]: returning[0],
                      [targetRelation.joiningTable.joiningColumn.columnName]: returningInversed[0],
                    })
                })
            })
          } else {
            throw new Error() //todo better message
          }
        }
      },
    })
    let primaryColumn = acceptFieldVisitor(schema, entity, entity.primary, {
      visitColumn: (entity, column) => column.columnName,
      visitRelation: () => {
        throw new Error()
      }
    })

    await Promise.all(beforeInsert)

    const mainInsert = await db.queryBuilder()
      .table(entity.tableName)
      .insert(rowData, primaryColumn)

    await Promise.all(afterInsert.map(callback => callback(mainInsert)))

    return mainInsert
  }
  return insertRow
}

const getCreateEntityMutation = (schema: Schema) => (entityName: string): GraphQLFieldConfig<any, any> & JoinMonsterFieldMapping<any, any> => {
  return {
    type: new GraphQLNonNull(getEntityType(schema)(entityName)),
    args: {
      data: {type: new GraphQLNonNull(getCreateEntityInputData(schema)(entityName))}
    },
    where: (tableName: string, args: any, context: any) => {
      const primary = schema.entities[entityName].primary
      return `${tableName}.${primary} = ${escapeParameter(context.returning[0])}`
    },
    resolve: (parent, args, context: Context, resolveInfo) => {
      return insertData(schema, context.db)(entityName, args.data)
        .then(returning => {
          return joinMonster(resolveInfo, {...context, returning: returning}, (sql) => {
            return context.db.raw(sql)
          }, {dialect: 'pg'})
        })
    },
  }
}

const getDeleteEntityMutation = (schema: Schema) => (entityName: string): GraphQLFieldConfig<any, any> => {
  return {
    type: getEntityType(schema)(entityName),
    args: {
      where: {type: new GraphQLNonNull(getPrimaryWhereType(schema)(entityName))},
    },
    resolve: () => console.log(JSON.stringify(arguments)),
  }
}

const getMutations = (schema: Schema) => (entityName: string) => {
  return {
    [`create${entityName}`]: getCreateEntityMutation(schema)(entityName),
    [`delete${entityName}`]: getDeleteEntityMutation(schema)(entityName),
  }
}

export { getMutations }
