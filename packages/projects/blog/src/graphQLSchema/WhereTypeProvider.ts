import singletonFactory from "../utils/singletonFactory";
import { GraphQLInputFieldConfig, GraphQLInputFieldConfigMap, GraphQLNonNull } from "graphql/type/definition";
import { Entity, FieldVisitor, JoiningColumnRelation, Schema } from "../schema/model";
import { GraphQLInputObjectType, GraphQLList } from "graphql";
import { capitalizeFirstLetter } from "../utils/strings";
import ColumnTypeResolver from "./ColumnTypeResolver";
import ConditionTypeProvider from "./ConditionTypeProvider";
import { isIt } from "../utils/type";
import { acceptFieldVisitor, getEntity } from "../schema/modelUtils";


export default class WhereTypeProvider
{
  private schema: Schema;

  private whereSingleton = singletonFactory(name => this.createEntityWhereType(name))
  private uniqueWhereSingleton = singletonFactory(name => this.createEntityUniqueWhereType(name))
  private columnTypeResolver: ColumnTypeResolver;
  private conditionTypeProvider: ConditionTypeProvider;

  constructor(schema: Schema, columnTypeResolver: ColumnTypeResolver, conditionTypeProvider: ConditionTypeProvider)
  {
    this.schema = schema;
    this.columnTypeResolver = columnTypeResolver;
    this.conditionTypeProvider = conditionTypeProvider;
  }

  getEntityWhereType(entityName: string): GraphQLInputObjectType
  {
    return this.whereSingleton(entityName)
  }

  getEntityUniqueWhereType(entityName: string)
  {
    return this.uniqueWhereSingleton(entityName)
  }

  private createEntityWhereType(entityName: string)
  {
    const where: GraphQLInputObjectType = new GraphQLInputObjectType({
      name: capitalizeFirstLetter(entityName) + "Where",
      fields: () => this.getEntityWhereFields(entityName, where),
    })

    return where
  }

  private createEntityUniqueWhereType(entityName: string)
  {
    const entity = getEntity(this.schema, entityName)

    return new GraphQLInputObjectType({
      name: capitalizeFirstLetter(entityName) + "UniqueWhere",
      fields: () => acceptFieldVisitor(this.schema, entity, entity.primary, {
        visitRelation: () => {
          throw new Error('Only simple field can be a primary')
        },
        visitColumn: (entity, column) => ({[column.name]: {type: this.columnTypeResolver.getType(column.type)}}),
      })
    })
  }

  private getEntityWhereFields(name: string, where: GraphQLInputObjectType)
  {
    const fields: GraphQLInputFieldConfigMap = {}
    let entity = this.schema.entities[name]

    for (let fieldName in entity.fields) {
      fields[fieldName] = acceptFieldVisitor(this.schema, name, fieldName, {
        visitColumn: (entity, column) => ({type: this.conditionTypeProvider.getCondition(column.type)}),
        visitRelation: (entity, relation) => ({type: this.getEntityWhereType(relation.target)}),
      } as FieldVisitor<GraphQLInputFieldConfig>)
    }

    fields.and = {type: new GraphQLList(new GraphQLNonNull(where))}
    fields.or = {type: new GraphQLList(new GraphQLNonNull(where))}
    fields.not = {type: where}

    return fields
  }
}
