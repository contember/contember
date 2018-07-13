import { GraphQLBoolean, GraphQLInputObjectType } from "graphql"
import { ColumnVisitor, Entity, Relation, RelationByGenericTypeVisitor, Schema } from "../../schema/model"
import { capitalizeFirstLetter } from "../../utils/strings"
import MutationProvider from "../MutationProvider"
import WhereTypeProvider from "../WhereTypeProvider"

export default class UpdateEntityRelationInputFieldVisitor implements ColumnVisitor<GraphQLInputObjectType>, RelationByGenericTypeVisitor<GraphQLInputObjectType>
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

  public visitHasOne(entity: Entity, relation: Relation, targetEntity: Entity, targetRelation: Relation | null): GraphQLInputObjectType
  {
    return new GraphQLInputObjectType({
      name: capitalizeFirstLetter(entity.name) + "Update" + capitalizeFirstLetter(relation.name) + "EntityRelationInput",
      fields: () => {
        const whereInput = {type: this.whereTypeBuilder.getEntityUniqueWhereType(targetEntity.name)}
        const updateInput = {type: this.mutationBuilder.getUpdateEntityInput(targetEntity.name, targetRelation ? targetRelation.name : undefined), }
        const createInput = {type: this.mutationBuilder.getCreateEntityInput(targetEntity.name, targetRelation ? targetRelation.name : undefined)}

        return {
          create: createInput,
          update: updateInput,
          upsert: {
            type: new GraphQLInputObjectType({
              name: capitalizeFirstLetter(entity.name) + "Upsert" + capitalizeFirstLetter(relation.name) + "RelationInput",
              fields: () => ({
                update: updateInput,
                create: createInput,
              })
            })
          },

          connect: whereInput,
          disconnect: {
            type: GraphQLBoolean,
          },
          delete: {
            type: GraphQLBoolean,
          },
        }
      }
    })
  }

  public visitHasMany(entity: Entity, relation: Relation, targetEntity: Entity, targetRelation: Relation | null): GraphQLInputObjectType
  {
    return new GraphQLInputObjectType({
      name: capitalizeFirstLetter(entity.name) + "Update" + capitalizeFirstLetter(relation.name) + "EntityRelationInput",
      fields: () => {
        const createInput = {type: this.mutationBuilder.getCreateEntityInput(targetEntity.name, targetRelation ? targetRelation.name : undefined)}
        const updateInput = {type: this.mutationBuilder.getUpdateEntityInput(targetEntity.name, targetRelation ? targetRelation.name : undefined)}

        const whereInput = {type: this.whereTypeBuilder.getEntityUniqueWhereType(targetEntity.name), }
        return {
          create: createInput,
          update: {
            type: new GraphQLInputObjectType({
              name: capitalizeFirstLetter(entity.name) + "Update" + capitalizeFirstLetter(relation.name) + "RelationInput",
              fields: () => ({
                where: whereInput,
                data: updateInput,
              })
            })
          },
          upsert: {
            type: new GraphQLInputObjectType({
              name: capitalizeFirstLetter(entity.name) + "Upsert" + capitalizeFirstLetter(relation.name) + "RelationInput",
              fields: () => ({
                where: whereInput,
                update: updateInput,
                create: createInput,
              })
            })
          },
          connect: whereInput,
          disconnect: whereInput,
          delete: whereInput,
        }
      }
    })
  }
}
