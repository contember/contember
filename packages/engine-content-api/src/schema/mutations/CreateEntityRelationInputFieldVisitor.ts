import { GraphQLInputObjectType } from 'graphql'
import { Input, Model } from '@contember/schema'
import { GqlTypeName } from '../utils'
import { WhereTypeProvider } from '../WhereTypeProvider'
import { Accessor } from '../../utils'
import { EntityInputProvider, EntityInputType } from './EntityInputProvider'
import { GraphQLInputFieldConfigMap } from 'graphql/type/definition'
import { CreateEntityRelationAllowedOperationsVisitor } from './CreateEntityRelationAllowedOperationsVisitor'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { GraphQLObjectsFactory } from '@contember/graphql-utils'
import { ImplementationException } from '../../exception'

export class CreateEntityRelationInputFieldVisitor
	implements Model.ColumnVisitor<never>, Model.RelationByGenericTypeVisitor<GraphQLInputObjectType | undefined> {
	constructor(
		private readonly schema: Model.Schema,
		private readonly whereTypeBuilder: WhereTypeProvider,
		private readonly createEntityInputProviderAccessor: Accessor<EntityInputProvider<EntityInputType.create>>,
		private readonly createEntityRelationAllowedOperationsVisitor: CreateEntityRelationAllowedOperationsVisitor,
		private readonly graphqlObjectFactories: GraphQLObjectsFactory,
	) {}

	public visitColumn(): never {
		throw new ImplementationException('CreateEntityRelationInputFieldVisitor: Not applicable for a column')
	}

	public visitHasOne(
		entity: Model.Entity,
		relation: Model.Relation & Model.NullableRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.Relation | null,
	): GraphQLInputObjectType | undefined {
		return this.createInputObject(entity, relation, targetEntity, targetRelation, false)
	}

	public visitHasMany(
		entity: Model.Entity,
		relation: Model.Relation,
		targetEntity: Model.Entity,
		targetRelation: Model.Relation | null,
	): GraphQLInputObjectType | undefined {
		return this.createInputObject(entity, relation, targetEntity, targetRelation, true)
	}

	public createInputObject(
		entity: Model.Entity,
		relation: Model.Relation,
		targetEntity: Model.Entity,
		targetRelation: Model.Relation | null,
		withAliasField: boolean,
	): GraphQLInputObjectType | undefined {
		const targetName = targetRelation ? targetRelation.name : undefined
		const fields: GraphQLInputFieldConfigMap = {}
		const allowedOperations = acceptFieldVisitor(
			this.schema,
			entity,
			relation.name,
			this.createEntityRelationAllowedOperationsVisitor,
		)

		if (allowedOperations.includes(Input.CreateRelationOperation.connect)) {
			const uniqueWhere = this.whereTypeBuilder.getEntityUniqueWhereType(targetEntity.name)
			if (uniqueWhere) {
				fields[Input.CreateRelationOperation.connect] = {
					type: uniqueWhere,
				}
			}
		}

		const createInput = this.createEntityInputProviderAccessor.get().getInput(targetEntity.name, targetName)
		if (allowedOperations.includes(Input.CreateRelationOperation.create) && createInput !== undefined) {
			fields[Input.CreateRelationOperation.create] = {
				type: createInput,
			}
		}
		if (Object.keys(fields).length === 0) {
			return undefined
		}
		return this.graphqlObjectFactories.createInputObjectType({
			name: GqlTypeName`${entity.name}Create${relation.name}EntityRelationInput`,
			fields: () =>
				withAliasField
					? {
							...fields,
							alias: { type: this.graphqlObjectFactories.string },
					  }
					: fields,
		})
	}
}
