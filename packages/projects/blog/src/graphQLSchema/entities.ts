import singletonFactory from "../utils/singletonFactory";
import { GraphQLFieldConfig, GraphQLList, GraphQLObjectType, GraphQLObjectTypeConfig, GraphQLOutputType } from "graphql";
import createJoinMonsterRelation from "../joinMonster/joinMonsterRelationFactory";
import { GraphQLFieldConfigMap, GraphQLNonNull } from "graphql/type/definition";
import { acceptFieldVisitor, FieldVisitor, getEntity, Schema } from "../model";
import { JoinMonsterEntityMapping, JoinMonsterFieldMapping } from "../joinMonsterHelpers";
import getColumnType from "./columns";
import { getEntityWhereType } from "./where";
import { quoteIdentifier } from "../sql/utils";

const getEntityFieldsPrototype = singletonFactory<GraphQLFieldConfigMap<any, any>>(name => ({}))

const entitySingleton = singletonFactory<GraphQLObjectType, Schema>((name, schema: Schema) => {
  const entity = getEntity(schema, name)
  const entityMapping: JoinMonsterEntityMapping = {
    sqlTable: quoteIdentifier(entity.tableName),
    uniqueKey: entity.primary,
  }

  return new GraphQLObjectType({
    name: name,
    fields: () => getEntityFieldsPrototype(name),
    ...entityMapping
  } as GraphQLObjectTypeConfig<any, any>)
})

const getEntityType = (schema: Schema) => (entityName: string) => entitySingleton(entityName, schema)

const completeEntityType = (schema: Schema) => {
  const relationFactory = createJoinMonsterRelation(schema)
  const getEntityTypeInSchema = getEntityType(schema)


  return (entityName: string) => {
    const entity = getEntity(schema, entityName)
    const getBasicType = getColumnType(schema)
    const entityRelationFactory = relationFactory(entity)

    const fieldsConfig = getEntityFieldsPrototype(entityName)
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

      fieldsConfig[fieldName] = acceptFieldVisitor(schema, entity, fieldName, {
        visitColumn: (entity, column) => ({
          type: type,
          sqlColumn: column.columnName,
        }),
        visitHasOne: (entity, relation) => ({
          type: type,
          ...entityRelationFactory(relation)
        }),
        visitHasMany: (entity, relation) => ({
          type: type,
          args: {
            where: {type: getEntityWhereType(relation.target)},
          },
          where: (tableAlias: string, args: any, context: any, sqlAstNode: any) => {
            return ''
          },
          ...entityRelationFactory(relation)
        }),
      } as FieldVisitor<JoinMonsterFieldMapping<any, any> & GraphQLFieldConfig<any, any>>)
    }
  }
}

export { getEntityType, completeEntityType }
