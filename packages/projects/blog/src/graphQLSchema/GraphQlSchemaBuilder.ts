import { Schema } from "../model";
import WhereTypeProvider from "./WhereTypeProvider";
import EntityTypeProvider from "./EntityTypeProvider";
import ColumnTypeResolver from "./ColumnTypeResolver";
import EnumsProvider from "./EnumsProvider";
import MutationProvider from "./MutationProvider";
import { GraphQLFieldConfig, GraphQLObjectType, GraphQLSchema } from "graphql";
import { JoinMonsterFieldMapping } from "../joinMonsterHelpers";
import QueryProvider from "./QueryProvider";
import resolver from "./resolver";

export default class GraphQlSchemaBuilder
{
  private schema: Schema
  private columnTypeResolver: ColumnTypeResolver
  private whereTypeProvider: WhereTypeProvider
  private entityTypeProvider: EntityTypeProvider
  private queryProvider: QueryProvider
  private mutationProvider: MutationProvider

  constructor(schema: Schema)
  {
    this.schema = schema
    this.columnTypeResolver = new ColumnTypeResolver(schema, new EnumsProvider(schema))
    this.whereTypeProvider = new WhereTypeProvider(this.schema, this.columnTypeResolver)
    this.entityTypeProvider = new EntityTypeProvider(this.schema, this.columnTypeResolver, this.whereTypeProvider)
    this.queryProvider = new QueryProvider(this.schema, this.whereTypeProvider, this.entityTypeProvider, resolver)
    this.mutationProvider = new MutationProvider(this.schema, this.whereTypeProvider, this.entityTypeProvider, this.columnTypeResolver)
  }

  build()
  {
    type FieldConfig = JoinMonsterFieldMapping<any, any> & GraphQLFieldConfig<any, any>

    return new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',
        fields: () => Object.keys(this.schema.entities).reduce<{ [queryName: string]: FieldConfig }>((queries, entityName) => {
          return {
            ...this.queryProvider.getQueries(entityName),
            ...queries,
          }
        }, {})
      }),
      mutation: new GraphQLObjectType({
        name: 'Mutation',
        fields: () => Object.keys(this.schema.entities).reduce<{ [queryName: string]: FieldConfig }>((mutations, entityName) => {
          return {
            ...this.mutationProvider.getMutations(entityName),
            ...mutations,
          }
        }, {})
      }),
    })
  }

}
