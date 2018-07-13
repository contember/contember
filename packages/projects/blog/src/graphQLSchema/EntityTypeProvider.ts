import { GraphQLFieldConfig, GraphQLObjectType, GraphQLObjectTypeConfig, GraphQLOutputType } from "graphql"
import { JoinMonsterEntityMapping, JoinMonsterFieldMapping } from "../joinMonsterHelpers"
import { Schema } from "../schema/model"
import { acceptFieldVisitor, getEntity } from "../schema/modelUtils"
import { quoteIdentifier } from "../sql/utils"
import singletonFactory from "../utils/singletonFactory"
import { capitalizeFirstLetter } from "../utils/strings"
import ColumnTypeResolver from "./ColumnTypeResolver"
import FieldTypeVisitor from "./entities/FieldTypeVisitor"
import JoinMonsterFieldMappingVisitor from "./entities/JoinMonsterFieldMappingVisitor"
import WhereTypeProvider from "./WhereTypeProvider"

export default class EntityTypeProvider
{
  private schema: Schema
  private columnTypeResolver: ColumnTypeResolver
  private whereTypeProvider: WhereTypeProvider

  private entities = singletonFactory(name => this.createEntity(name))

  constructor(schema: Schema, columnTypeResolver: ColumnTypeResolver, whereTypeProvider: WhereTypeProvider)
  {
    this.schema = schema
    this.columnTypeResolver = columnTypeResolver
    this.whereTypeProvider = whereTypeProvider
  }

  public getEntity(entityName: string): GraphQLObjectType
  {
    return this.entities(entityName)
  }

  private createEntity(entityName: string)
  {
    const entity = getEntity(this.schema, entityName)
    const entityMapping: JoinMonsterEntityMapping = {
      sqlTable: quoteIdentifier(entity.tableName),
      uniqueKey: entity.primaryColumn,
    }

    return new GraphQLObjectType({
      name: capitalizeFirstLetter(entityName),
      fields: () => this.getEntityFields(entityName),
      ...entityMapping
    } as GraphQLObjectTypeConfig<any, any>)
  }

  private getEntityFields(entityName: string)
  {
    const entity = getEntity(this.schema, entityName)
    const fields: { [field: string]: GraphQLFieldConfig<any, any> & JoinMonsterFieldMapping<any, any> } = {}

    for (const fieldName in entity.fields) {
      const type: GraphQLOutputType = acceptFieldVisitor(this.schema, entity, fieldName, new FieldTypeVisitor(this.columnTypeResolver, this))

      fields[fieldName] = {
        type,
        ...acceptFieldVisitor(this.schema, entity, fieldName, new JoinMonsterFieldMappingVisitor(this.schema, this.whereTypeProvider)),
      }
    }
    return fields

  }
}
