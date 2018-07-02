import singletonFactory from "../utils/singletonFactory";
import { GraphQLFieldConfig, GraphQLList, GraphQLObjectType, GraphQLObjectTypeConfig, GraphQLOutputType } from "graphql";
import createJoinMonsterRelation from "../joinMonster/joinMonsterRelationFactory";
import { GraphQLFieldConfigMap, GraphQLNonNull } from "graphql/type/definition";
import { acceptFieldVisitor, FieldVisitor, getEntity, Schema } from "../model";
import { JoinMonsterEntityMapping, JoinMonsterFieldMapping } from "../joinMonsterHelpers";
import getColumnType from "./columns";
import { getEntityWhereType } from "./where";
import { quoteIdentifier } from "../sql/utils";
import { buildWhere } from "../whereMonster";
import { aliasInAst, joinToAst } from "../joinMonster/sqlAstNodeUtils";
import { capitalizeFirstLetter } from "../utils/strings";

const entitySingleton = singletonFactory<GraphQLObjectType, string, Schema>((name, schema: Schema) => {
  const entity = getEntity(schema, name)
  const entityMapping: JoinMonsterEntityMapping = {
    sqlTable: quoteIdentifier(entity.tableName),
    uniqueKey: entity.primary,
  }

  return new GraphQLObjectType({
    name: capitalizeFirstLetter(name),
    fields: () => getEntityFields(schema)(name),
    ...entityMapping
  } as GraphQLObjectTypeConfig<any, any>)
})

const getEntityType = (schema: Schema) => (entityName: string) => entitySingleton(entityName, schema)

const getEntityFields = (schema: Schema) => {
  const relationFactory = createJoinMonsterRelation(schema)
  const getEntityTypeInSchema = getEntityType(schema)


  return (entityName: string) => {
    const entity = getEntity(schema, entityName)
    const getBasicType = getColumnType(schema)
    const entityRelationFactory = relationFactory(entity)

    const fields: GraphQLFieldConfigMap<any, any> = {}
    for (let fieldName in entity.fields) {

      const type: GraphQLOutputType = acceptFieldVisitor(schema, entity, fieldName, {
        visitColumn: (entity, column) => {
          const basicType = getBasicType(column.type)
          return column.nullable ? basicType : new GraphQLNonNull(basicType)
        },
        visitHasMany: (entity, relation) => {
          return new GraphQLList(new GraphQLNonNull(getEntityTypeInSchema(relation.target)))
        },
        visitHasOne: (entity, relation) => {
          return relation.nullable ? getEntityTypeInSchema(relation.target) : new GraphQLNonNull(getEntityTypeInSchema(relation.target))
        },
      } as FieldVisitor<GraphQLOutputType>)

      fields[fieldName] = acceptFieldVisitor(schema, entity, fieldName, {
        visitColumn: (entity, column) => ({
          type: type,
          sqlColumn: column.columnName,
        }),
        visitHasOne: (entity, relation) => ({
          type: type,
          ...entityRelationFactory(relation)
        }),
        visitHasMany: (entity, relation, targetEntity) => ({
          type: type,
          args: {
            where: {type: getEntityWhereType(schema)(relation.target)},
          },
          where: (tableAlias: string, args: any, context: any, sqlAstNode: any) => {
            const createAlias = aliasInAst(sqlAstNode)
            return buildWhere(schema, targetEntity, joinToAst(schema, createAlias)(sqlAstNode, targetEntity))(tableAlias, args.where || {})
          },
          ...entityRelationFactory(relation)
        }),
      } as FieldVisitor<JoinMonsterFieldMapping<any, any> & GraphQLFieldConfig<any, any>>)
    }
    return fields
  }
}

export { getEntityType }
