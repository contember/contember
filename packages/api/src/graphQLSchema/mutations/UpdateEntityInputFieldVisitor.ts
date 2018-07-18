import { GraphQLInputFieldConfig, GraphQLList, GraphQLNonNull } from "graphql"
import { Column, ColumnVisitor, Entity, NullableRelation, Relation, RelationByGenericTypeVisitor } from "../../schema/model"
import ColumnTypeResolver from "../ColumnTypeResolver"
import MutationProvider from "../MutationProvider"

export default class UpdateEntityInputFieldVisitor
  implements ColumnVisitor<GraphQLInputFieldConfig | undefined>,
    RelationByGenericTypeVisitor<GraphQLInputFieldConfig | undefined>
{
  private columnTypeResolver: ColumnTypeResolver
  private mutationProvider: MutationProvider

  constructor(columnTypeResolver: ColumnTypeResolver, mutationProvider: MutationProvider)
  {
    this.columnTypeResolver = columnTypeResolver
    this.mutationProvider = mutationProvider
  }

  public visitColumn(entity: Entity, column: Column): GraphQLInputFieldConfig | undefined
  {
    if (entity.primary === column.name) {
      return undefined
    }
    return {
      type: this.columnTypeResolver.getType(column.type),
    }
  }

  public visitHasOne(entity: Entity, relation: Relation & NullableRelation): GraphQLInputFieldConfig
  {
    return {
      type: this.mutationProvider.getUpdateEntityRelationInput(entity.name, relation.name),
    }
  }

  public visitHasMany(entity: Entity, relation: Relation): GraphQLInputFieldConfig
  {
    const type = this.mutationProvider.getUpdateEntityRelationInput(entity.name, relation.name)
    return {
      type: new GraphQLList(new GraphQLNonNull(type))
    }
  }
}
