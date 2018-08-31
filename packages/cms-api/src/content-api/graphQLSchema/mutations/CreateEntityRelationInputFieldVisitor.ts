import { GraphQLInputObjectType } from 'graphql'
import { Model } from 'cms-common'
import MutationProvider from '../MutationProvider'
import { GqlTypeName } from '../utils'
import WhereTypeProvider from '../WhereTypeProvider'

export default class CreateEntityRelationInputFieldVisitor
	implements Model.ColumnVisitor<GraphQLInputObjectType>, Model.RelationVisitor<GraphQLInputObjectType> {
	private whereTypeBuilder: WhereTypeProvider
	private mutationBuilder: MutationProvider

	constructor(schema: Model.Schema, whereTypeBuilder: WhereTypeProvider, mutationBuilder: MutationProvider) {
		this.whereTypeBuilder = whereTypeBuilder
		this.mutationBuilder = mutationBuilder
	}

	public visitColumn(): GraphQLInputObjectType {
		throw new Error()
	}

	public visitRelation(
		entity: Model.Entity,
		relation: Model.Relation,
		targetEntity: Model.Entity,
		targetRelation: Model.Relation
	): GraphQLInputObjectType {
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
