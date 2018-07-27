import { GraphQLBoolean, GraphQLInputObjectType } from "graphql"
import { ColumnVisitor, Entity, NullableRelation, Relation, RelationByGenericTypeVisitor, Schema } from "../../schema/model"
import MutationProvider from "../MutationProvider"
import { GqlTypeName } from "../utils"
import WhereTypeProvider from "../WhereTypeProvider"
import { isIt } from "../../utils/type";

export default class UpdateEntityRelationInputFieldVisitor
  implements ColumnVisitor<GraphQLInputObjectType>,
    RelationByGenericTypeVisitor<GraphQLInputObjectType>
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

  public visitHasOne(entity: Entity, relation: Relation & NullableRelation, targetEntity: Entity, targetRelation: Relation | null): GraphQLInputObjectType
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

  public visitHasMany(entity: Entity, relation: Relation, targetEntity: Entity, targetRelation: Relation | null): GraphQLInputObjectType
  {
    const canDisconnect = targetRelation && isIt<NullableRelation>(targetRelation, 'nullable') ? targetRelation.nullable : true

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
