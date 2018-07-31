import { GraphQLInputObjectType } from "graphql"
import { ColumnVisitor, Entity, Relation, RelationVisitor, Schema } from "../../../content-schema/model"
import MutationProvider from "../MutationProvider"
import { GqlTypeName } from "../utils"
import WhereTypeProvider from "../WhereTypeProvider"

export default class CreateEntityRelationInputFieldVisitor
  implements ColumnVisitor<GraphQLInputObjectType>,
    RelationVisitor<GraphQLInputObjectType>
{
  private whereTypeBuilder: WhereTypeProvider
  private mutationBuilder: MutationProvider

  constructor(schema: Schema, whereTypeBuilder: WhereTypeProvider, mutationBuilder: MutationProvider)
  {
    this.whereTypeBuilder = whereTypeBuilder
    this.mutationBuilder = mutationBuilder
  }

  public visitColumn(): GraphQLInputObjectType
  {
    throw new Error()
  }

  public visitRelation(entity: Entity, relation: Relation, targetEntity: Entity, targetRelation: Relation): GraphQLInputObjectType
  {
    return new GraphQLInputObjectType({
      name: GqlTypeName`${entity.name}Create${relation.name}EntityRelationInput`,
      fields: () => {
        const targetName = targetRelation ? targetRelation.name : undefined
        return {
          connect: {
            type: this.whereTypeBuilder.getEntityUniqueWhereType(targetEntity.name)
          },
          create: {
            type: this.mutationBuilder.getCreateEntityInput(targetEntity.name, targetName)
          }
        }
      }
    })
  }
}
