import { GraphQLInputFieldConfig, GraphQLList, GraphQLNonNull } from "graphql"
import { Column, ColumnVisitor, Entity, NullableRelation, Relation, RelationByGenericTypeVisitor } from "../../../schema/model"
import ColumnTypeResolver from "../ColumnTypeResolver"
import MutationProvider from "../MutationProvider"

export default class CreateEntityInputFieldVisitor
  implements ColumnVisitor<GraphQLInputFieldConfig | undefined>,
    RelationByGenericTypeVisitor<GraphQLInputFieldConfig>
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
    const type = this.columnTypeResolver.getType(column.type)
    return {
      type: column.nullable ? type : new GraphQLNonNull(type),
    }
  }

  public visitHasOne(entity: Entity, relation: Relation & NullableRelation): GraphQLInputFieldConfig
  {
    const type = this.mutationProvider.getCreateEntityRelationInput(entity.name, relation.name)
    return {
      type: relation.nullable ? type : new GraphQLNonNull(type),
    }
  }

  public visitHasMany(entity: Entity, relation: Relation): GraphQLInputFieldConfig
  {
    const type = this.mutationProvider.getCreateEntityRelationInput(entity.name, relation.name)
    return {
      type: new GraphQLList(new GraphQLNonNull(type))
    }
  }
}
