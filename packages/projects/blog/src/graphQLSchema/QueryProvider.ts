import { GraphQLError, GraphQLFieldConfig, GraphQLFieldResolver, GraphQLList, GraphQLNonNull } from "graphql"
import { aliasInAst, joinToAst } from "../joinMonster/sqlAstNodeUtils"
import { JoinMonsterFieldMapping } from "../joinMonsterHelpers"
import { ListQueryInput, UniqueQueryInput } from "../schema/input"
import { isUniqueWhere } from "../schema/inputUtils"
import { Schema } from "../schema/model"
import { getEntity } from "../schema/modelUtils"
import { Context } from "../types"
import { buildWhere } from "../whereMonster"
import buildUniqueWhere from "../whereMonster/uniqueWhereBuilder"
import EntityTypeProvider from "./EntityTypeProvider"
import WhereTypeProvider from "./WhereTypeProvider"

type FieldConfig<TArgs> = JoinMonsterFieldMapping<Context, TArgs> & GraphQLFieldConfig<Context, any, TArgs>

export default class QueryProvider
{
  private schema: Schema
  private whereTypeProvider: WhereTypeProvider
  private entityTypeProvider: EntityTypeProvider
  private resolver: GraphQLFieldResolver<any, any>

  constructor(schema: Schema, whereTypeProvider: WhereTypeProvider, entityTypeProvider: EntityTypeProvider, resolver: GraphQLFieldResolver<any, any>)
  {
    this.schema = schema
    this.whereTypeProvider = whereTypeProvider
    this.entityTypeProvider = entityTypeProvider
    this.resolver = resolver
  }

  public getQueries(entityName: string): { [fieldName: string]: FieldConfig<any> }
  {
    const entity = getEntity(this.schema, entityName)
    return {
      [entityName]: this.getByUniqueQuery(entityName),
      [entity.pluralName || (entityName + "s")]: this.getListQuery(entityName),
    }
  }

  private getByUniqueQuery(entityName: string): FieldConfig<UniqueQueryInput>
  {
    const entity = getEntity(this.schema, entityName)
    return {
      type: this.entityTypeProvider.getEntity(entityName),
      args: {
        where: {type: new GraphQLNonNull(this.whereTypeProvider.getEntityUniqueWhereType(entityName))}
      },
      where: (tableName, args) => {
        return buildUniqueWhere(this.schema, entity)(tableName, args.where)
      },
      resolve: (parent, args, context, info) => {
        if (!isUniqueWhere(entity, args.where)) {
          throw new GraphQLError("Input where is not unique")
        }
        return this.resolver(parent, args, context, info)
      },
    }
  }

  private getListQuery(entityName: string): FieldConfig<ListQueryInput>
  {
    const entity = getEntity(this.schema, entityName)

    return {
      type: new GraphQLList(this.entityTypeProvider.getEntity(entityName)),
      args: {
        where: {type: this.whereTypeProvider.getEntityWhereType(entityName)},
      },
      where: (tableAlias, args, context, sqlAstNode) => {
        const createAlias = aliasInAst(sqlAstNode)

        return buildWhere(this.schema, entity, joinToAst(this.schema, createAlias)(sqlAstNode, entity))(tableAlias, args.where || {})
      },
      resolve: this.resolver,
    }
  }
}
