import { Column, ColumnVisitor, Entity, NullableRelation, Relation, RelationByGenericTypeVisitor } from "../../model";
import { GraphQLInputFieldConfig, GraphQLList, GraphQLNonNull } from "graphql";
import ColumnTypeResolver from "../ColumnTypeResolver";
import MutationProvider from "../MutationProvider";

export default class CreateEntityInputFieldVisitor implements ColumnVisitor<GraphQLInputFieldConfig | undefined>, RelationByGenericTypeVisitor<GraphQLInputFieldConfig>
{
  private columnTypeResolver: ColumnTypeResolver;
  private mutationProvider: MutationProvider;

  constructor(columnTypeResolver: ColumnTypeResolver, mutationProvider: MutationProvider)
  {
    this.columnTypeResolver = columnTypeResolver;
    this.mutationProvider = mutationProvider;
  }

  visitColumn(entity: Entity, column: Column): GraphQLInputFieldConfig | undefined
  {
    if (entity.primary === column.name) {
      return undefined
    }
    const type = this.columnTypeResolver.getType(column.type)
    return {
      type: column.nullable ? type : new GraphQLNonNull(type),
    }
  }

  visitHasOne(entity: Entity, relation: Relation & NullableRelation): GraphQLInputFieldConfig
  {
    const type = this.mutationProvider.getCreateEntityRelationInput(entity.name, relation.name)
    return {
      type: relation.nullable ? type : new GraphQLNonNull(type),
    }
  }

  visitHasMany(entity: Entity, relation: Relation): GraphQLInputFieldConfig
  {
    return {
      type: new GraphQLList(new GraphQLNonNull(this.mutationProvider.getCreateEntityRelationInput(entity.name, relation.name)))
    }
  }
}
