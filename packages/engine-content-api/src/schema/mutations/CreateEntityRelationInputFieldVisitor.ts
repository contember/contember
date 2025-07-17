import { GraphQLInputFieldConfigMap, GraphQLInputObjectType, GraphQLString } from 'graphql'
import { Input, Model } from '@contember/schema'
import { GqlTypeName } from '../utils'
import { WhereTypeProvider } from '../WhereTypeProvider'
import { Accessor, Interface } from '../../utils'
import { EntityInputProvider, EntityInputType } from './EntityInputProvider'
import { CreateEntityRelationAllowedOperationsVisitor } from './CreateEntityRelationAllowedOperationsVisitor'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { ImplementationException } from '../../exception'
import { ConnectOrCreateRelationInputProvider } from './ConnectOrCreateRelationInputProvider'

export class CreateEntityRelationInputFieldVisitor implements
	Model.ColumnVisitor<never>,
	Model.RelationByGenericTypeVisitor<GraphQLInputObjectType | undefined> {

	constructor(
		private readonly schema: Model.Schema,
		private readonly whereTypeBuilder: WhereTypeProvider,
		private readonly createEntityInputProviderAccessor: Accessor<Interface<EntityInputProvider<EntityInputType.create>>>,
		private readonly createEntityRelationAllowedOperationsVisitor: CreateEntityRelationAllowedOperationsVisitor,
		private readonly connectOrCreateRelationInputProvider: ConnectOrCreateRelationInputProvider,
	) {}

	public visitColumn(): never {
		throw new ImplementationException('CreateEntityRelationInputFieldVisitor: Not applicable for a column')
	}

	public visitHasOne(context: Model.ManyHasOneContext): GraphQLInputObjectType | undefined {
		return this.createInputObject(context, false)
	}

	public visitHasMany(context: Model.OneHasManyContext): GraphQLInputObjectType | undefined {
		return this.createInputObject(context, true)
	}

	public createInputObject(
		{ entity, relation, targetEntity, targetRelation }: Model.AnyRelationContext,
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

		const uniqueWhere = this.whereTypeBuilder.getEntityUniqueWhereType(targetEntity.name)
		if (allowedOperations.includes(Input.CreateRelationOperation.connect) && uniqueWhere) {
			fields[Input.CreateRelationOperation.connect] = {
				type: uniqueWhere,
			}
		}

		const createInput = this.createEntityInputProviderAccessor.get().getInput(targetEntity.name, targetName)
		if (allowedOperations.includes(Input.CreateRelationOperation.create) && createInput !== undefined) {
			fields[Input.CreateRelationOperation.create] = {
				type: createInput,
			}
		}
		if (allowedOperations.includes(Input.CreateRelationOperation.connectOrCreate) && uniqueWhere !== undefined && createInput !== undefined) {
			const connectOrCreateInput = this.connectOrCreateRelationInputProvider.getInput(entity.name, relation.name)
			if (connectOrCreateInput) {
				fields[Input.CreateRelationOperation.connectOrCreate] = {
					type: connectOrCreateInput,
				}
			}
		}
		if (Object.keys(fields).length === 0) {
			return undefined
		}
		return new GraphQLInputObjectType({
			name: GqlTypeName`${entity.name}Create${relation.name}EntityRelationInput`,
			description: relation.description,
			fields: () => withAliasField
				? {
					...fields,
					alias: { type: GraphQLString },
				}
				: fields,
		})
	}
}
