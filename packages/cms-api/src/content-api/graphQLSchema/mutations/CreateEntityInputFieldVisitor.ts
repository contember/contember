import { GraphQLInputFieldConfig, GraphQLList, GraphQLNonNull } from "graphql"
import { Model } from "cms-common"
import ColumnTypeResolver from "../ColumnTypeResolver"
import MutationProvider from "../MutationProvider"

export default class CreateEntityInputFieldVisitor
  implements Model.ColumnVisitor<GraphQLInputFieldConfig | undefined>,
    Model.RelationByGenericTypeVisitor<GraphQLInputFieldConfig>
{
  private columnTypeResolver: ColumnTypeResolver
  private mutationProvider: MutationProvider

  constructor(columnTypeResolver: ColumnTypeResolver, mutationProvider: MutationProvider)
  {
    this.columnTypeResolver = columnTypeResolver
    this.mutationProvider = mutationProvider
  }

  public visitColumn(entity: Model.Entity, column: Model.Column): GraphQLInputFieldConfig | undefined
  {
    if (entity.primary === column.name) {
      return undefined
    }
    const type = this.columnTypeResolver.getType(column.type)
    return {
      type: column.nullable ? type : new GraphQLNonNull(type),
    }
  }

  public visitHasOne(entity: Model.Entity, relation: Model.Relation & Model.NullableRelation): GraphQLInputFieldConfig
  {
    const type = this.mutationProvider.getCreateEntityRelationInput(entity.name, relation.name)
    return {
      type: relation.nullable ? type : new GraphQLNonNull(type),
    }
  }

  public visitHasMany(entity: Model.Entity, relation: Model.Relation): GraphQLInputFieldConfig
  {
    const type = this.mutationProvider.getCreateEntityRelationInput(entity.name, relation.name)
    return {
      type: new GraphQLList(new GraphQLNonNull(type))
    }
  }
}
