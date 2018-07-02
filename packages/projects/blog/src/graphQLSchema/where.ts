import singletonFactory from "../utils/singletonFactory";
import { GraphQLInputFieldConfigMap, GraphQLNonNull } from "graphql/type/definition";
import { acceptFieldVisitor, getEntity, Schema } from "../model";
import { GraphQLInputObjectType, GraphQLList } from "graphql";
import getColumnType from "./columns";
import { getConditionType } from "./conditions";
import { capitalizeFirstLetter } from "../utils/strings";


const whereSingleton = singletonFactory((name, schema: Schema) => {
  const where: GraphQLInputObjectType = new GraphQLInputObjectType({
    name: capitalizeFirstLetter(name) + "Where",
    fields: () => getEntityWhereFields(schema)(name, where),
  })

  return where
})

const getEntityWhereType = (schema: Schema) => (name: string) => whereSingleton(name, schema)


const getEntityWhereFields = (schema: Schema) => (name: string, where: GraphQLInputObjectType) => {
  const fields: GraphQLInputFieldConfigMap = {}
  const getConditionTypeInSchema = getConditionType(schema)
  let entity = schema.entities[name]
  for (let fieldName in entity.fields) {
    fields[fieldName] = acceptFieldVisitor(schema, name, fieldName, {
      visitColumn: (entity, column) => ({type: getConditionTypeInSchema(column.type)}),
      visitRelation: (entity, relation) => ({type: getEntityWhereType(schema)(relation.target)}),
    })
  }
  fields.and = {type: new GraphQLList(new GraphQLNonNull(where))}
  fields.or = {type: new GraphQLList(new GraphQLNonNull(where))}
  fields.not = {type: where}

  return fields
}

const uniqueWhereSingleton = singletonFactory((entityName: string, schema: Schema) => {
  const entity = getEntity(schema, entityName)
  const getBasicType = getColumnType(schema)

  return new GraphQLInputObjectType({
    name: capitalizeFirstLetter(entityName) + "UniqueWhere",
    fields: () => acceptFieldVisitor(schema, entity, entity.primary, {
      visitRelation: () => {
        throw new Error('Only simple field can be a primary')
      },
      visitColumn: (entity, column) => ({[column.name]: {type: getBasicType(column.type)}}),
    })
  })
})

const getPrimaryWhereType = (schema: Schema) => (entityName: string) => uniqueWhereSingleton(entityName, schema)

export {
  getEntityWhereType,
  getPrimaryWhereType,
}
