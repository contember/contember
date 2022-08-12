import { Accessor, Interface, singletonFactory } from '../../utils'
import { GraphQLInputObjectType } from 'graphql'
import { GqlTypeName } from '../utils'
import { WhereTypeProvider } from '../WhereTypeProvider'
import { EntityInputProvider, EntityInputType } from './EntityInputProvider'
import { Model } from '@contember/schema'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { ImplementationException } from '../../exception'

type Args = {
	entityName: string
	relationName: string
}

export class ConnectOrCreateRelationInputProvider {
	private inputs = singletonFactory<GraphQLInputObjectType, Args>(id => this.createInput(id.entityName, id.relationName))

	constructor(
		private readonly schema: Model.Schema,
		private readonly whereTypeBuilder: WhereTypeProvider,
		private readonly createEntityInputProviderAccessor: Accessor<Interface<EntityInputProvider<EntityInputType.create>>>,
	) {
	}


	getInput(entityName: string, relationName: string) {
		return this.inputs({ entityName, relationName })
	}

	private createInput(entityName: string, relationName: string) {
		return acceptFieldVisitor<GraphQLInputObjectType>(this.schema, entityName, relationName, {
			visitColumn() {
				throw new ImplementationException()
			},
			visitRelation: (entity: Model.Entity, relation: Model.Relation, targetEntity: Model.Entity, targetRelation: Model.AnyRelation | null) => {
				const uniqueWhere = this.whereTypeBuilder.getEntityUniqueWhereType(targetEntity.name)
				const targetName = targetRelation ? targetRelation.name : undefined
				const createInput = this.createEntityInputProviderAccessor.get().getInput(targetEntity.name, targetName)
				if (!uniqueWhere || !createInput) {
					throw new ImplementationException()
				}

				return new GraphQLInputObjectType({
					name: GqlTypeName`${entity.name}ConnectOrCreate${relation.name}RelationInput`,
					fields: () => ({
						connect: { type: uniqueWhere },
						create: { type: createInput },
					}),
				})
			},
		})

	}
}
