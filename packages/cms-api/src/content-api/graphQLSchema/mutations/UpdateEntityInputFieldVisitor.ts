import { GraphQLInputFieldConfig, GraphQLList, GraphQLNonNull } from "graphql"
import { Model } from "cms-common"
import ColumnTypeResolver from "../ColumnTypeResolver"
import MutationProvider from "../MutationProvider"

export default class UpdateEntityInputFieldVisitor
  implements Model.ColumnVisitor<GraphQLInputFieldConfig | undefined>,
    Model.RelationByGenericTypeVisitor<GraphQLInputFieldConfig | undefined>
{
  private columnTypeResolver: ColumnTypeResolver
  private mutationProvider: MutationProvider

  constructor(columnTypeResolver: ColumnTypeResolver, mutationProvider: MutationProvider)
  {
    this.columnTypeResolver = columnTypeResolver
    this.mutationProvider = mutationProvider
  }

  public visitColumn(entity: Model.Entity, column: Model.AnyColumn): GraphQLInputFieldConfig | undefined
  {
    if (entity.primary === column.name) {
      return undefined
    }
    return {
      type: this.columnTypeResolver.getType(column),
    }
  }

  public visitHasOne(entity: Model.Entity, relation: Model.Relation & Model.NullableRelation): GraphQLInputFieldConfig
  {
    return {
      type: this.mutationProvider.getUpdateEntityRelationInput(entity.name, relation.name),
    }
  }

  public visitHasMany(entity: Model.Entity, relation: Model.Relation): GraphQLInputFieldConfig
  {
    const type = this.mutationProvider.getUpdateEntityRelationInput(entity.name, relation.name)
    return {
      type: new GraphQLList(new GraphQLNonNull(type))
    }
  }
}
