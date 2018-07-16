import { GraphQLFieldConfig, GraphQLObjectType, GraphQLSchema } from "graphql"
import { JoinMonsterFieldMapping } from "../joinMonsterHelpers"
import { Schema } from "../schema/model"
import ColumnTypeResolver from "./ColumnTypeResolver"
import ConditionTypeProvider from "./ConditionTypeProvider"
import EntityTypeProvider from "./EntityTypeProvider"
import EnumsProvider from "./EnumsProvider"
import MutationProvider from "./MutationProvider"
import QueryProvider from "./QueryProvider"
import resolver from "./resolver"
import WhereTypeProvider from "./WhereTypeProvider"

export default class GraphQlSchemaBuilder
{
  private schema: Schema
  private columnTypeResolver: ColumnTypeResolver
  private conditionTypeProvider: ConditionTypeProvider
  private whereTypeProvider: WhereTypeProvider
  private entityTypeProvider: EntityTypeProvider
  private queryProvider: QueryProvider
  private mutationProvider: MutationProvider

  constructor(schema: Schema)
  {
    this.schema = schema
    this.columnTypeResolver = new ColumnTypeResolver(schema, new EnumsProvider(schema))
    this.conditionTypeProvider = new ConditionTypeProvider(this.columnTypeResolver)
    this.whereTypeProvider = new WhereTypeProvider(this.schema, this.columnTypeResolver, this.conditionTypeProvider)
    this.entityTypeProvider = new EntityTypeProvider(this.schema, this.columnTypeResolver, this.whereTypeProvider)
    this.queryProvider = new QueryProvider(this.schema, this.whereTypeProvider, this.entityTypeProvider, resolver)
    this.mutationProvider = new MutationProvider(this.schema, this.whereTypeProvider, this.entityTypeProvider, this.columnTypeResolver, resolver)
  }

  public build()
  {
    type FieldConfig = JoinMonsterFieldMapping<any, any> & GraphQLFieldConfig<any, any>
    interface FieldConfigMap { [queryName: string]: FieldConfig }

    return new GraphQLSchema({
      query: new GraphQLObjectType({
        name: "Query",
        fields: () => Object.keys(this.schema.entities).reduce<FieldConfigMap>((queries, entityName) => {
          return {
            ...this.queryProvider.getQueries(entityName),
            ...queries,
          }
        }, {})
      }),
      mutation: new GraphQLObjectType({
        name: "Mutation",
        fields: () => Object.keys(this.schema.entities).reduce<FieldConfigMap>((mutations, entityName) => {
          return {
            ...this.mutationProvider.getMutations(entityName),
            ...mutations,
          }
        }, {})
      }),
    })
  }

}
