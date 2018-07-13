import { Column, ColumnVisitor, Entity, NullableRelation, Relation, RelationByGenericTypeVisitor } from "../../schema/model";
import { GraphQLInputFieldConfig, GraphQLList, GraphQLNonNull } from "graphql";
import ColumnTypeResolver from "../ColumnTypeResolver";
import MutationProvider from "../MutationProvider";

export default class UpdateEntityInputFieldVisitor implements ColumnVisitor<GraphQLInputFieldConfig | undefined>, RelationByGenericTypeVisitor<GraphQLInputFieldConfig | undefined>
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
    return {
      type: this.columnTypeResolver.getType(column.type),
    }
  }

  visitHasOne(entity: Entity, relation: Relation & NullableRelation): GraphQLInputFieldConfig
  {
    return {
      type: this.mutationProvider.getUpdateEntityRelationInput(entity.name, relation.name),
    }
  }

  visitHasMany(entity: Entity, relation: Relation): GraphQLInputFieldConfig
  {
    return {
      type: new GraphQLList(new GraphQLNonNull(this.mutationProvider.getUpdateEntityRelationInput(entity.name, relation.name)))
    }
  }
}
