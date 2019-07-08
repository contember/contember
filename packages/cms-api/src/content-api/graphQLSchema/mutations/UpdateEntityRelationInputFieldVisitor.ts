import { GraphQLBoolean, GraphQLInputObjectType, GraphQLString } from 'graphql'
import { Input, Model } from 'cms-common'
import { GqlTypeName } from '../utils'
import WhereTypeProvider from '../WhereTypeProvider'
import { Accessor } from '../../../utils/accessor'
import EntityInputProvider from './EntityInputProvider'
import { GraphQLInputFieldConfig, GraphQLInputFieldConfigMap } from 'graphql/type/definition'
import { acceptFieldVisitor } from '../../../content-schema/modelUtils'
import UpdateEntityRelationAllowedOperationsVisitor from './UpdateEntityRelationAllowedOperationsVisitor'
import { filterObject } from '../../../utils/object'

export default class UpdateEntityRelationInputFieldVisitor
	implements Model.ColumnVisitor<never>, Model.RelationByGenericTypeVisitor<GraphQLInputObjectType | undefined> {
	constructor(
		private readonly schema: Model.Schema,
		private readonly whereTypeBuilder: WhereTypeProvider,
		private readonly updateEntityInputProviderAccessor: Accessor<EntityInputProvider<EntityInputProvider.Type.update>>,
		private readonly createEntityInputProvider: EntityInputProvider<EntityInputProvider.Type.create>,
		private readonly updateEntityRelationAllowedOperationsVisitor: UpdateEntityRelationAllowedOperationsVisitor
	) {}

	public visitColumn(): never {
		throw new Error()
	}

	public visitHasOne(
		entity: Model.Entity,
		relation: Model.Relation & Model.NullableRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.Relation | null
	): GraphQLInputObjectType | undefined {
		const withoutRelation = targetRelation ? targetRelation.name : undefined

		const whereInput = {
			type: this.whereTypeBuilder.getEntityUniqueWhereType(targetEntity.name),
		}
		const createInputType = this.createEntityInputProvider.getInput(targetEntity.name, withoutRelation)
		const createInput = createInputType
			? {
					type: createInputType,
			  }
			: undefined
		const updateInputType = this.updateEntityInputProviderAccessor.get().getInput(targetEntity.name, withoutRelation)
		const updateInput = updateInputType
			? {
					type: updateInputType,
			  }
			: undefined
		const upsertInput =
			updateInput && createInput
				? {
						type: new GraphQLInputObjectType({
							name: GqlTypeName`${entity.name}Upsert${relation.name}RelationInput`,
							fields: () => ({
								update: updateInput,
								create: createInput,
							}),
						}),
				  }
				: undefined
		const booleanInput = {
			type: GraphQLBoolean,
		}

		const fields = {
			[Input.UpdateRelationOperation.create]: createInput,
			[Input.UpdateRelationOperation.update]: updateInput,
			[Input.UpdateRelationOperation.upsert]: upsertInput,
			[Input.UpdateRelationOperation.connect]: whereInput,
			[Input.UpdateRelationOperation.disconnect]: booleanInput,
			[Input.UpdateRelationOperation.delete]: booleanInput,
		}

		const filteredFields = this.filterAllowedOperations(entity, relation, fields)
		if (Object.keys(filteredFields).length === 0) {
			return undefined
		}

		return new GraphQLInputObjectType({
			name: GqlTypeName`${entity.name}Update${relation.name}EntityRelationInput`,
			fields: () => filteredFields,
		})
	}

	public visitHasMany(
		entity: Model.Entity,
		relation: Model.Relation,
		targetEntity: Model.Entity,
		targetRelation: Model.Relation | null
	): GraphQLInputObjectType | undefined {
		const withoutRelation = targetRelation ? targetRelation.name : undefined

		const whereInput = {
			type: this.whereTypeBuilder.getEntityUniqueWhereType(targetEntity.name),
		}
		const createInputType = this.createEntityInputProvider.getInput(targetEntity.name, withoutRelation)
		const createInput = createInputType
			? {
					type: createInputType,
			  }
			: undefined
		const updateInputType = this.updateEntityInputProviderAccessor.get().getInput(targetEntity.name, withoutRelation)
		const updateInput = updateInputType
			? {
					type: updateInputType,
			  }
			: undefined

		const updateSpecifiedInput = updateInput
			? {
					type: new GraphQLInputObjectType({
						name: GqlTypeName`${entity.name}Update${relation.name}RelationInput`,
						fields: () => ({
							by: whereInput,
							data: updateInput,
						}),
					}),
			  }
			: undefined

		const upsertInput =
			updateInput && createInput
				? {
						type: new GraphQLInputObjectType({
							name: GqlTypeName`${entity.name}Upsert${relation.name}RelationInput`,
							fields: () => ({
								by: whereInput,
								update: updateInput,
								create: createInput,
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
			fields: () => ({
				...filteredFields,
				alias: { type: GraphQLString },
			}),
		})
	}

	private filterAllowedOperations(
		entity: Model.Entity,
		relation: Model.Relation,
		graphQlFields: { [key: string]: GraphQLInputFieldConfig | undefined }
	): GraphQLInputFieldConfigMap {
		const allowedOperations = acceptFieldVisitor(
			this.schema,
			entity,
			relation.name,
			this.updateEntityRelationAllowedOperationsVisitor
		)
		return filterObject(
			graphQlFields,
			(key, value): value is GraphQLInputFieldConfig =>
				allowedOperations.includes(key as Input.UpdateRelationOperation) && value !== undefined
		)
	}
}
