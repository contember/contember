import { GraphQLBoolean, GraphQLInputObjectType } from 'graphql'
import { Model } from 'cms-common'
import { GqlTypeName } from '../utils'
import WhereTypeProvider from '../WhereTypeProvider'
import { isIt } from '../../../utils/type'
import { Accessor } from '../../../utils/accessor'
import EntityInputProvider from './EntityInputProvider'
import { GraphQLInputFieldConfigMap } from 'graphql/type/definition'
import Authorizator from '../../../acl/Authorizator'

export default class UpdateEntityRelationInputFieldVisitor
	implements Model.ColumnVisitor<GraphQLInputObjectType>, Model.RelationByGenericTypeVisitor<GraphQLInputObjectType> {
	constructor(
		private authorizator: Authorizator,
		private whereTypeBuilder: WhereTypeProvider,
		private updateEntityInputProviderAccessor: Accessor<EntityInputProvider<Authorizator.Operation.update>>,
		private createEntityInputProvider: EntityInputProvider<Authorizator.Operation.create>
	) {}

	public visitColumn(): GraphQLInputObjectType {
		throw new Error()
	}

	public visitHasOne(
		entity: Model.Entity,
		relation: Model.Relation & Model.NullableRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.Relation | null
	): GraphQLInputObjectType {
		return new GraphQLInputObjectType({
			name: GqlTypeName`${entity.name}Update${relation.name}EntityRelationInput`,
			fields: () => {
				const withoutRelation = targetRelation ? targetRelation.name : undefined

				const updateInput = {
					type: this.updateEntityInputProviderAccessor.get().getInput(targetEntity.name, withoutRelation)
				}
				const createInput = { type: this.createEntityInputProvider.getInput(targetEntity.name, withoutRelation) }
				const whereInput = { type: this.whereTypeBuilder.getEntityUniqueWhereType(targetEntity.name) }

				const fields: GraphQLInputFieldConfigMap = {}
				if (this.authorizator.isAllowed(Authorizator.Operation.create, targetEntity.name)) {
					fields['create'] = createInput
				}
				if (this.authorizator.isAllowed(Authorizator.Operation.update, targetEntity.name)) {
					fields['update'] = updateInput
				}
				if (
					this.authorizator.isAllowed([Authorizator.Operation.update, Authorizator.Operation.create], targetEntity.name)
				) {
					fields['upsert'] = {
						type: new GraphQLInputObjectType({
							name: GqlTypeName`${entity.name}Upsert${relation.name}RelationInput`,
							fields: () => ({
								update: updateInput,
								create: createInput
							})
						})
					}
				}

				//fixme this is not so easy, connect may require update of one of sides
				if (this.authorizator.isAllowed(Authorizator.Operation.read, targetEntity.name)) {
					fields['connect'] = whereInput
				}

				//fixme this is not so easy, disconnect may require update of one of sides
				if (relation.nullable) {
					fields['disconnect'] = { type: GraphQLBoolean }
				}

				if (relation.nullable && this.authorizator.isAllowed(Authorizator.Operation.delete, targetEntity.name)) {
					if (relation.nullable) {
						fields['delete'] = { type: GraphQLBoolean }
					}
				}

				return fields
			}
		})
	}

	public visitHasMany(
		entity: Model.Entity,
		relation: Model.Relation,
		targetEntity: Model.Entity,
		targetRelation: Model.Relation | null
	): GraphQLInputObjectType {
		let canDisconnect: boolean = true
		if (targetRelation && isIt<Model.NullableRelation>(targetRelation, 'nullable')) {
			canDisconnect = targetRelation.nullable
		}

		return new GraphQLInputObjectType({
			name: GqlTypeName`${entity.name}Update${relation.name}EntityRelationInput`,
			fields: () => {
				const withoutRelation = targetRelation ? targetRelation.name : undefined

				const createInput = { type: this.createEntityInputProvider.getInput(targetEntity.name, withoutRelation) }
				const updateInput = {
					type: this.updateEntityInputProviderAccessor.get().getInput(targetEntity.name, withoutRelation)
				}
				const whereInput = { type: this.whereTypeBuilder.getEntityUniqueWhereType(targetEntity.name) }

				const fields: GraphQLInputFieldConfigMap = {}

				if (this.authorizator.isAllowed(Authorizator.Operation.create, targetEntity.name)) {
					fields['create'] = createInput
				}

				if (this.authorizator.isAllowed(Authorizator.Operation.update, targetEntity.name)) {
					fields['update'] = {
						type: new GraphQLInputObjectType({
							name: GqlTypeName`${entity.name}Update${relation.name}RelationInput`,
							fields: () => ({
								where: whereInput,
								data: updateInput
							})
						})
					}
				}

				if (
					this.authorizator.isAllowed([Authorizator.Operation.update, Authorizator.Operation.create], targetEntity.name)
				) {
					fields['upsert'] = {
						type: new GraphQLInputObjectType({
							name: GqlTypeName`${entity.name}Upsert${relation.name}RelationInput`,
							fields: () => ({
								where: whereInput,
								update: updateInput,
								create: createInput
							})
						})
					}
				}

				if (this.authorizator.isAllowed(Authorizator.Operation.delete, targetEntity.name)) {
					fields['delete'] = whereInput
				}

				//fixme this is not so easy, connect may require update of one of sides
				if (this.authorizator.isAllowed(Authorizator.Operation.read, targetEntity.name)) {
					fields['connect'] = whereInput
				}

				//fixme this is not so easy, disconnect may require update of one of sides
				if (canDisconnect && this.authorizator.isAllowed(Authorizator.Operation.read, targetEntity.name)) {
					fields['disconnect'] = whereInput
				}

				return fields
			}
		})
	}
}
