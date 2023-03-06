import {
	GraphQLBoolean,
	GraphQLInputFieldConfig,
	GraphQLInputFieldConfigMap,
	GraphQLInputObjectType, GraphQLNonNull,
	GraphQLString,
} from 'graphql'
import { Acl, Input, Model } from '@contember/schema'
import { GqlTypeName } from '../utils'
import { WhereTypeProvider } from '../WhereTypeProvider'
import { Accessor, filterObject } from '../../utils'
import { EntityInputProvider, EntityInputType } from './EntityInputProvider'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { UpdateEntityRelationAllowedOperationsVisitor } from './UpdateEntityRelationAllowedOperationsVisitor'
import { Authorizator } from '../../acl'
import { ImplementationException } from '../../exception'
import { ConnectOrCreateRelationInputProvider } from './ConnectOrCreateRelationInputProvider'

export class UpdateEntityRelationInputFieldVisitor implements Model.ColumnVisitor<never>,
	Model.RelationByGenericTypeVisitor<GraphQLInputObjectType | undefined> {

	constructor(
		private readonly schema: Model.Schema,
		private readonly authorizator: Authorizator,
		private readonly whereTypeBuilder: WhereTypeProvider,
		private readonly updateEntityInputProviderAccessor: Accessor<EntityInputProvider<EntityInputType.update>>,
		private readonly createEntityInputProvider: EntityInputProvider<EntityInputType.create>,
		private readonly updateEntityRelationAllowedOperationsVisitor: UpdateEntityRelationAllowedOperationsVisitor,
		private readonly connectOrCreateRelationInputProvider: ConnectOrCreateRelationInputProvider,
	) {
	}

	public visitColumn(): never {
		throw new Error('UpdateEntityRelationInputFieldVisitor: Not applicable for a column')
	}

	public visitHasOne({ targetRelation, targetEntity, relation, entity }: Model.AnyHasOneRelationContext) {
		const withoutRelation = targetRelation ? targetRelation.name : undefined

		const whereInputType = this.createUniqueWhereInput(targetEntity)
		const whereInput = whereInputType ? { type: whereInputType } : undefined

		const createInputType = this.createEntityInputProvider.getInput(targetEntity.name, withoutRelation)
		const createInput = createInputType ? { type: createInputType } : undefined

		const updateInputType = this.updateEntityInputProviderAccessor.get().getInput(targetEntity.name, withoutRelation)
		const updateInput = updateInputType ? {  type: updateInputType } : undefined

		const upsertInput = updateInputType && createInputType
			? {
				type: new GraphQLInputObjectType({
					description: relation.description,
					name: GqlTypeName`${entity.name}Upsert${relation.name}RelationInput`,
					fields: () => ({
						update: { type: new GraphQLNonNull(updateInputType) },
						create: { type: new GraphQLNonNull(createInputType) },
					}),
				}),
				  }
			: undefined
		const booleanInput = {
			type: GraphQLBoolean,
		}

		const connectOrCreateInput = createInput && whereInputType
			? { type: this.connectOrCreateRelationInputProvider.getInput(entity.name, relation.name) }
			: undefined

		const fields = {
			[Input.UpdateRelationOperation.connect]: whereInput,
			[Input.UpdateRelationOperation.create]: createInput,
			[Input.UpdateRelationOperation.connectOrCreate]: connectOrCreateInput,
			[Input.UpdateRelationOperation.update]: updateInput,
			[Input.UpdateRelationOperation.upsert]: upsertInput,
			[Input.UpdateRelationOperation.disconnect]: booleanInput,
			[Input.UpdateRelationOperation.delete]: booleanInput,
		}

		const filteredFields = this.filterAllowedOperations(entity, relation, fields)
		if (Object.keys(filteredFields).length === 0) {
			return undefined
		}

		return new GraphQLInputObjectType({
			name: GqlTypeName`${entity.name}Update${relation.name}EntityRelationInput`,
			description: relation.description,
			fields: () => filteredFields,
		})
	}

	public visitHasMany({ entity, relation, targetEntity, targetRelation }: Model.AnyHasManyRelationContext) {
		const withoutRelation = targetRelation ? targetRelation.name : undefined

		const whereInputType = this.createUniqueWhereInput(targetEntity)
		const whereInput = whereInputType ? { type: whereInputType } : undefined

		const createInputType = this.createEntityInputProvider.getInput(targetEntity.name, withoutRelation)
		const createInput = createInputType ? { type: createInputType } : undefined

		const updateInputType = this.updateEntityInputProviderAccessor.get().getInput(targetEntity.name, withoutRelation)

		const updateSpecifiedInput = updateInputType && whereInputType
			? {
				type: new GraphQLInputObjectType({
					name: GqlTypeName`${entity.name}Update${relation.name}RelationInput`,
					description: relation.description,
					fields: () => ({
						by: { type: new GraphQLNonNull(whereInputType) },
						data: { type: new GraphQLNonNull(updateInputType) },
					}),
				}),
				  }
			: undefined

		const upsertInput = updateInputType && createInputType && whereInputType
			? {
				type: new GraphQLInputObjectType({
					name: GqlTypeName`${entity.name}Upsert${relation.name}RelationInput`,
					description: relation.description,
					fields: () => ({
						by: { type: new GraphQLNonNull(whereInputType) },
						update: { type: new GraphQLNonNull(updateInputType) },
						create: { type: new GraphQLNonNull(createInputType) },
					}),
				}),
				  }
			: undefined

		const fields = {
			[Input.UpdateRelationOperation.create]: createInput,
			[Input.UpdateRelationOperation.update]: updateSpecifiedInput,
			[Input.UpdateRelationOperation.upsert]: upsertInput,
			[Input.UpdateRelationOperation.connect]: whereInput,
			[Input.UpdateRelationOperation.disconnect]: whereInput,
			[Input.UpdateRelationOperation.delete]: whereInput,
		}

		const filteredFields = this.filterAllowedOperations(entity, relation, fields)
		if (Object.keys(filteredFields).length === 0) {
			return undefined
		}

		return new GraphQLInputObjectType({
			name: GqlTypeName`${entity.name}Update${relation.name}EntityRelationInput`,
			description: relation.description,
			fields: () => ({
				...filteredFields,
				alias: { type: GraphQLString },
			}),
		})
	}

	private filterAllowedOperations(
		entity: Model.Entity,
		relation: Model.Relation,
		graphQlFields: { [key: string]: GraphQLInputFieldConfig | undefined },
	): GraphQLInputFieldConfigMap {
		const allowedOperations = acceptFieldVisitor(
			this.schema,
			entity,
			relation.name,
			this.updateEntityRelationAllowedOperationsVisitor,
		)
		return filterObject(
			graphQlFields,
			(key, value): value is GraphQLInputFieldConfig =>
				allowedOperations.includes(key as Input.UpdateRelationOperation) && value !== undefined,
		)
	}

	private createUniqueWhereInput(targetEntity: Model.Entity): GraphQLInputObjectType | undefined {
		if (this.authorizator.getEntityPermission(Acl.Operation.read, targetEntity.name) === 'no') {
			return undefined
		}
		const uniqueWhere = this.whereTypeBuilder.getEntityUniqueWhereType(targetEntity.name)
		if (!uniqueWhere) {
			throw new ImplementationException()
		}
		return uniqueWhere
	}
}
