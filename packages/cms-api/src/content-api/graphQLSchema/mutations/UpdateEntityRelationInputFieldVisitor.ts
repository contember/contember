import { GraphQLBoolean, GraphQLInputObjectType } from "graphql"
import { Model } from "cms-common"
import MutationProvider from "../MutationProvider"
import { GqlTypeName } from "../utils"
import WhereTypeProvider from "../WhereTypeProvider"
import { isIt } from "../../../utils/type";

export default class UpdateEntityRelationInputFieldVisitor
  implements Model.ColumnVisitor<GraphQLInputObjectType>,
    Model.RelationByGenericTypeVisitor<GraphQLInputObjectType>
{
  private whereTypeBuilder: WhereTypeProvider
  private mutationBuilder: MutationProvider

  constructor(schema: Model.Schema, whereTypeBuilder: WhereTypeProvider, mutationBuilder: MutationProvider)
  {
    this.whereTypeBuilder = whereTypeBuilder
    this.mutationBuilder = mutationBuilder
  }

  public visitColumn(): GraphQLInputObjectType
  {
    throw new Error()
  }

  public visitHasOne(entity: Model.Entity, relation: Model.Relation & Model.NullableRelation, targetEntity: Model.Entity, targetRelation: Model.Relation | null): GraphQLInputObjectType
  {
    return new GraphQLInputObjectType({
      name: GqlTypeName`${entity.name}Update${relation.name}EntityRelationInput`,
      fields: () => {
        const whereInput = {type: this.whereTypeBuilder.getEntityUniqueWhereType(targetEntity.name)}

        const withoutRelation = targetRelation ? targetRelation.name : undefined
        const updateInput = {type: this.mutationBuilder.getUpdateEntityInput(targetEntity.name, withoutRelation),}
        const createInput = {type: this.mutationBuilder.getCreateEntityInput(targetEntity.name, withoutRelation)}

        return {
          create: createInput,
          update: updateInput,
          upsert: {
            type: new GraphQLInputObjectType({
              name: GqlTypeName`${entity.name}Upsert${relation.name}RelationInput`,
              fields: () => ({
                update: updateInput,
                create: createInput,
              })
            })
          },

          connect: whereInput,
          ...(relation.nullable ? {
            disconnect: {
              type: GraphQLBoolean,
            },
            delete: {
              type: GraphQLBoolean,
            },
          } : {})
        }
      }
    })
  }

  public visitHasMany(entity: Model.Entity, relation: Model.Relation, targetEntity: Model.Entity, targetRelation: Model.Relation | null): GraphQLInputObjectType
  {
    let canDisconnect: boolean = true
    if (targetRelation && isIt<Model.NullableRelation>(targetRelation, 'nullable')) {
      canDisconnect = targetRelation.nullable
    }

    return new GraphQLInputObjectType({
      name: GqlTypeName`${entity.name}Update${relation.name}EntityRelationInput`,
      fields: () => {
        const withoutRelation = targetRelation ? targetRelation.name : undefined
        const createInput = {type: this.mutationBuilder.getCreateEntityInput(targetEntity.name, withoutRelation)}
        const updateInput = {type: this.mutationBuilder.getUpdateEntityInput(targetEntity.name, withoutRelation)}

        const whereInput = {type: this.whereTypeBuilder.getEntityUniqueWhereType(targetEntity.name)}
        return {
          create: createInput,
          update: {
            type: new GraphQLInputObjectType({
              name: GqlTypeName`${entity.name}Update${relation.name}RelationInput`,
              fields: () => ({
                where: whereInput,
                data: updateInput,
              })
            })
          },
          upsert: {
            type: new GraphQLInputObjectType({
              name: GqlTypeName`${entity.name}Upsert${relation.name}RelationInput`,
              fields: () => ({
                where: whereInput,
                update: updateInput,
                create: createInput,
              })
            })
          },
          delete: whereInput,
          connect: whereInput,
          ...(canDisconnect ? {
            disconnect: whereInput,
          } : {}),
        }
      }
    })
  }
}
