import singletonFactory from "../utils/singletonFactory";
import { GraphQLFieldConfigArgumentMap, GraphQLInputFieldConfigMap, GraphQLNonNull } from "graphql/type/definition";
import { acceptFieldVisitor, getEntity, Schema } from "../model";
import { GraphQLInputObjectType, GraphQLList } from "graphql";
import getColumnType from "./columns";
import { getConditionType } from "./conditions";

const getEntityWhereFieldsPrototype = singletonFactory<GraphQLInputFieldConfigMap>(name => ({}))

const getEntityWhereType = singletonFactory(name => {
  const fieldPrototypes = getEntityWhereFieldsPrototype(name)
  const where: GraphQLInputObjectType = new GraphQLInputObjectType({
    name: name + "Where",
    fields: () => fieldPrototypes,
  })
  fieldPrototypes.and = {type: new GraphQLList(new GraphQLNonNull(where))}
  fieldPrototypes.or = {type: new GraphQLList(new GraphQLNonNull(where))}
  fieldPrototypes.not = {type: where}

  return where
})
const completeEntityWhereType = (schema: Schema) => (name: string) => {
  const whereFieldsPrototype = getEntityWhereFieldsPrototype(name)
  const getConditionTypeInSchema = getConditionType(schema)
  let entity = schema.entities[name]
  for (let fieldName in entity.fields) {
    whereFieldsPrototype[fieldName] = acceptFieldVisitor(schema, name, fieldName, {
      visitColumn: (entity, column) => ({type: getConditionTypeInSchema(column.type)}),
      visitRelation: (entity, relation) => ({type: getEntityWhereType(relation.target)}),
    })
  }
}

const getPrimaryWhereArgs = (schema: Schema) => {
  const getBasicType = getColumnType(schema)

  return (entityName: string): GraphQLFieldConfigArgumentMap => {
    let entity = getEntity(schema, entityName)

    return acceptFieldVisitor(schema, entity, entity.primary, {
      visitRelation: () => {
        throw new Error('Only simple field can be a primary')
      },
      visitColumn: (entity, column) => ({[column.name]: {type: getBasicType(column.type)}}),
    })
  }
}


export {
  getEntityWhereType,
  getPrimaryWhereArgs,
  completeEntityWhereType,
}
