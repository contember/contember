import { ColumnVisitor, Entity, Relation, RelationVisitor, Schema } from "../../../model";
import { GraphQLInputObjectType } from "graphql";
import { capitalizeFirstLetter } from "../../../utils/strings";
import MutationProvider from "../../MutationProvider";
import WhereTypeProvider from "../../WhereTypeProvider";

export default class ConnectInputVisitor implements ColumnVisitor<GraphQLInputObjectType>, RelationVisitor<GraphQLInputObjectType>
{
  private whereTypeBuilder: WhereTypeProvider;
  private mutationBuilder: MutationProvider;

  constructor(schema: Schema, whereTypeBuilder: WhereTypeProvider, mutationBuilder: MutationProvider)
  {
    this.whereTypeBuilder = whereTypeBuilder;
    this.mutationBuilder = mutationBuilder;
  }

  visitColumn(): GraphQLInputObjectType
  {
    throw new Error()
  }

  visitRelation(entity: Entity, relation: Relation, targetEntity: Entity, targetRelation: Relation): GraphQLInputObjectType
  {
    return new GraphQLInputObjectType({
      name: capitalizeFirstLetter(entity.name) + "Create" + capitalizeFirstLetter(relation.name) + "Input",
      fields: () => {
        return {
          connect: {
            type: this.whereTypeBuilder.getEntityUniqueWhereType(targetEntity.name)
          },
          create: {
            type: this.mutationBuilder.getCreateEntityInput(targetEntity.name, targetRelation ? targetRelation.name : undefined)
          }
        }
      }
    })
  }
}
