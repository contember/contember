import { Column, ColumnVisitor, Entity, NullableRelation, Relation, RelationByGenericTypeVisitor } from "../../schema/model";
import { GraphQLNonNull, GraphQLOutputType } from "graphql/type/definition";
import ColumnTypeResolver from "../ColumnTypeResolver";
import EntityTypeProvider from "../EntityTypeProvider";
import { GraphQLList } from "graphql";

export default class FieldTypeVisitor implements ColumnVisitor<GraphQLOutputType>, RelationByGenericTypeVisitor<GraphQLOutputType>
{
  private columnTypeResolver: ColumnTypeResolver;
  private entityTypeProvider: EntityTypeProvider;

  constructor(columnTypeResolver: ColumnTypeResolver, entityTypeProvider: EntityTypeProvider)
  {
    this.columnTypeResolver = columnTypeResolver;
    this.entityTypeProvider = entityTypeProvider;
  }

  visitColumn(entity: Entity, column: Column): GraphQLOutputType
  {
    const basicType = this.columnTypeResolver.getType(column.type)
    return column.nullable ? basicType : new GraphQLNonNull(basicType)
  }

  visitHasMany(entity: Entity, relation: Relation): GraphQLOutputType
  {
    return new GraphQLList(new GraphQLNonNull(this.entityTypeProvider.getEntity(relation.target)))
  }

  visitHasOne(entity: Entity, relation: Relation & NullableRelation): GraphQLOutputType
  {
    const entityType = this.entityTypeProvider.getEntity(relation.target)
    return relation.nullable ? entityType : new GraphQLNonNull(entityType)
  }
}
