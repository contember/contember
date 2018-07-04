import { acceptFieldVisitor, FieldVisitor, getEntity, Schema } from "../model";
import { GraphQLFieldConfig, GraphQLInputFieldConfig, GraphQLInputFieldConfigMap, GraphQLInputObjectType, GraphQLList, GraphQLNonNull } from "graphql";
import { getEntityType } from "./entities";
import getColumnType from "./columns";
import { getPrimaryWhereType } from "./where";
import singletonFactory from "../utils/singletonFactory";
import { capitalizeFirstLetter } from "../utils/strings";
import { Context } from "../types";
import joinMonster from "join-monster";
import { JoinMonsterFieldMapping } from "../joinMonsterHelpers";
import { escapeParameter } from "../sql/utils";
import insertData from "../sql/mapper";

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


const getCreateEntityMutation = (schema: Schema) => (entityName: string): GraphQLFieldConfig<any, any> & JoinMonsterFieldMapping<any, any> => {
  return {
    type: new GraphQLNonNull(getEntityType(schema)(entityName)),
    args: {
      data: {type: new GraphQLNonNull(getCreateEntityInputData(schema)(entityName))}
    },
    where: (tableName: string, args: any, context: any) => {
      const primary = schema.entities[entityName].primary
      return `${tableName}.${primary} = ${escapeParameter(context.primary)}`
    },
    resolve: (parent, args, context: Context, resolveInfo) => {
      return insertData(schema, context.db)(entityName, args.data)
        .then(primary => {
          return joinMonster(resolveInfo, {...context, primary}, (sql) => {
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
