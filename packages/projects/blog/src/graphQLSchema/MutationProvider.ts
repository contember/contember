import { acceptFieldVisitor, FieldVisitor, getEntity, Schema } from "../model";
import {
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
  GraphQLInputFieldConfig,
  GraphQLInputFieldConfigMap,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull
} from "graphql";
import singletonFactory from "../utils/singletonFactory";
import { capitalizeFirstLetter } from "../utils/strings";
import { Context } from "../types";
import joinMonster from "join-monster";
import { JoinMonsterFieldMapping } from "../joinMonsterHelpers";
import { escapeParameter } from "../sql/utils";
import insertData from "../sql/mapper";
import WhereTypeProvider from "./WhereTypeProvider";
import EntityTypeProvider from "./EntityTypeProvider";
import ColumnTypeResolver from "./ColumnTypeResolver";
import ConnectInputVisitor from "./mutations/update/ConnectInputVisitor";

type RelationDefinition = { entityName: string, relationName: string }

export default class MutationProvider
{
  private schema: Schema
  private whereTypeProvider: WhereTypeProvider
  private entityTypeProvider: EntityTypeProvider
  private columnTypeResolver: ColumnTypeResolver

  private createEntityInputs = singletonFactory<GraphQLInputObjectType, { entityName: string, withoutRelation?: string }>(id =>
    this.createCreateEntityInput(id.entityName, id.withoutRelation)
  )

  private createEntityConnectionInputs = singletonFactory((id: RelationDefinition) => this.createCreateEntityConnectionInput(id.entityName, id.relationName))

  constructor(schema: Schema, whereTypeProvider: WhereTypeProvider, entityTypeProvider: EntityTypeProvider, columnTypeResolver: ColumnTypeResolver)
  {
    this.schema = schema
    this.whereTypeProvider = whereTypeProvider
    this.entityTypeProvider = entityTypeProvider
    this.columnTypeResolver = columnTypeResolver
  }

  getCreateMutation(entityName: string): GraphQLFieldConfig<any, any> & JoinMonsterFieldMapping<any, any>
  {
    return {
      type: new GraphQLNonNull(this.entityTypeProvider.getEntity(entityName)),
      args: {
        data: {type: new GraphQLNonNull(this.getCreateEntityInput(entityName))}
      },
      where: (tableName: string, args: any, context: any) => {
        const primary = this.schema.entities[entityName].primary
        return `${tableName}.${primary} = ${escapeParameter(context.primary)}`
      },
      resolve: async (parent, args, context: Context, resolveInfo) => {
        const primary = await insertData(this.schema, context.db)(entityName, args.data)
        return await joinMonster(resolveInfo, {...context, primary}, (sql) => {
          return context.db.raw(sql)
        }, {dialect: 'pg'})
      },
    }
  }

  getDeleteMutation(entityName: string): GraphQLFieldConfig<any, any>
  {
    return {
      type: this.entityTypeProvider.getEntity(entityName),
      args: {
        where: {type: new GraphQLNonNull(this.whereTypeProvider.getEntityUniqueWhereType(entityName))},
      },
      resolve: () => console.log(JSON.stringify(arguments)),
    }
  }

  getMutations(entityName: string): GraphQLFieldConfigMap<any, any>
  {
    return {
      [`create${entityName}`]: this.getCreateMutation(entityName),
      [`delete${entityName}`]: this.getDeleteMutation(entityName),
    }
  }

  getCreateEntityInput(entityName: string, withoutRelation?: string): GraphQLInputObjectType
  {
    return this.createEntityInputs({entityName, withoutRelation})
  }

  createCreateEntityInput(entityName: string, withoutRelation?: string)
  {
    const withoutSuffix = withoutRelation ? "Without" + capitalizeFirstLetter(withoutRelation) : ''

    return new GraphQLInputObjectType({
      name: capitalizeFirstLetter(entityName) + withoutSuffix + "CreateInput",
      fields: () => {
        const fields: GraphQLInputFieldConfigMap = {}
        let entity = getEntity(this.schema, entityName);
        for (let fieldName in entity.fields) {
          if (withoutRelation && fieldName === withoutRelation) {
            continue
          }
          if (fieldName === entity.primary) {
            continue //todo maybe optional?
          }
          fields[fieldName] = acceptFieldVisitor(this.schema, entityName, fieldName, {
            visitColumn: (entity, column) => {
              const type = this.columnTypeResolver.getType(column.type)
              return {
                type: column.nullable ? type : new GraphQLNonNull(type),
              }
            },
            visitHasOne: (entity, relation) => {
              const type = this.getCreateEntityConnectionInput(entity.name, relation.name)
              return {
                type: relation.nullable ? type : new GraphQLNonNull(type),
              }
            },
            visitHasMany: (entity, relation) => {
              return {
                type: new GraphQLList(new GraphQLNonNull(this.getCreateEntityConnectionInput(entity.name, relation.name)))
              }
            },
          } as FieldVisitor<GraphQLInputFieldConfig>)
        }

        return fields
      }
    })
  }

  getCreateEntityConnectionInput(entityName: string, relationName: string)
  {
    return this.createEntityConnectionInputs({entityName, relationName})
  }

  createCreateEntityConnectionInput(entityName: string, relationName: string): GraphQLInputObjectType
  {
    return acceptFieldVisitor(this.schema, entityName, relationName, new ConnectInputVisitor(this.schema, this.whereTypeProvider, this))
  }
}
