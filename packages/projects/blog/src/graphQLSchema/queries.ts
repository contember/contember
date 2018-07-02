import { buildWhere } from "../whereMonster";
import { getEntity, Schema } from "../model";
import { aliasInAst, joinToAst } from "../joinMonster/sqlAstNodeUtils";
import { GraphQLFieldConfig, GraphQLList } from "graphql";
import { JoinMonsterFieldMapping, SqlAstNode } from "../joinMonsterHelpers";
import { getEntityWhereType, getPrimaryWhereType } from "./where";
import { getEntityType } from "./entities";
import joinMonster from "join-monster";
import { Context } from "../types";
import { escapeParameter } from "../sql/utils";

type FieldConfig = JoinMonsterFieldMapping<any, any> & GraphQLFieldConfig<any, any>

const resolver = (parent: any, args: any, context: Context, resolveInfo: any) => {
  return joinMonster(resolveInfo, context, (sql: string) => {
    return context.db.raw(sql)
  }, {dialect: 'pg'})
}

const getListQuery = (schema: Schema) => {

  const getEntityTypeInSchema = getEntityType(schema)

  return (entityName: string): FieldConfig => {
    const entity = getEntity(schema, entityName)

    return {
      type: new GraphQLList(getEntityTypeInSchema(entityName)),
      args: {
        where: {type: getEntityWhereType(schema)(entityName)},
      },
      where: (tableAlias: string, args: any, context: any, sqlAstNode: SqlAstNode) => {
        const createAlias = aliasInAst(sqlAstNode)

        return buildWhere(schema, entity, joinToAst(schema, createAlias)(sqlAstNode, entity))(tableAlias, args.where || {})
      },
      resolve: resolver,
    }
  }
}
const getByPrimaryQuery = (schema: Schema) => {
  return (entityName: string): FieldConfig => {
    return {
      type: getEntityType(schema)(entityName),
      args: {
        where: {type: getPrimaryWhereType(schema)(entityName)}
      },
      where: (tableName: string, args: any, context: any) => {
        return `${tableName}.${schema.entities[entityName].primary} = ${escapeParameter(args.id)}`
      },
      resolve: resolver,
    }
  }
}

const getQueries = (schema: Schema) => {
  return (entityName: string) => {
    const entity = getEntity(schema, entityName)
    return {
      [entityName]: getByPrimaryQuery(schema)(entityName),
      [entity.pluralName || (entityName + "s")]: getListQuery(schema)(entityName),
    }
  }
}

export default getQueries
