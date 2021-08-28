import { GraphQLInputObjectType, GraphQLNonNull } from 'graphql'
import { Acl, Model } from '@contember/schema'
import {
	aliasAwareResolver,
	EntityTypeProvider,
	FieldAccessVisitor,
	GqlTypeName,
	WhereTypeProvider,
} from '../../schema'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { Authorizator } from '../../acl'
import { getFieldsForUniqueWhere } from '../../utils'
import { HasManyToHasOneReducerExtension } from './HasManyToHasOneReducer'
import { FieldMap } from '../EntityFieldsProvider'

export class HasManyToHasOneRelationReducerFieldVisitor implements
	Model.ColumnVisitor<FieldMap<HasManyToHasOneReducerExtension>>,
	Model.RelationByTypeVisitor<FieldMap<HasManyToHasOneReducerExtension>> {

	constructor(
		private readonly schema: Model.Schema,
		private readonly authorizator: Authorizator,
		private readonly entityTypeProvider: EntityTypeProvider,
		private readonly whereTypeProvider: WhereTypeProvider,
	) {}

	public visitColumn() {
		return {}
	}

	public visitOneHasOneOwning() {
		return {}
	}

	public visitOneHasOneInverse() {
		return {}
	}

	public visitManyHasOne() {
		return {}
	}

	public visitManyHasManyInverse() {
		return {}
	}

	public visitManyHasManyOwning() {
		return {}
	}

	public visitOneHasMany(
		entity: Model.Entity,
		relation: Model.AnyRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.AnyRelation | null,
	) {
		if (!targetRelation) {
			return {}
		}
		const uniqueConstraints = getFieldsForUniqueWhere(this.schema, targetEntity)
		const composedUnique = uniqueConstraints
			.filter(fields => fields.length === 2) //todo support all uniques
			.filter(fields => fields.includes(targetRelation.name))
			.map(fields => fields.filter(it => it !== targetRelation.name))
			.map(fields => fields[0])
		const singleUnique = uniqueConstraints
			.filter(fields => fields.length === 1 && fields[0] !== targetEntity.primary)
			.map(fields => fields[0])
			.filter(it => it !== targetRelation.name)

		return [...composedUnique, ...singleUnique]
			.filter(field =>
				acceptFieldVisitor(
					this.schema,
					targetEntity.name,
					field,
					new FieldAccessVisitor(Acl.Operation.read, this.authorizator),
				),
			)
			.reduce<FieldMap<HasManyToHasOneReducerExtension>>((fields, fieldName) => {
				const graphQlName = relation.name + GqlTypeName`By${fieldName}`
				const uniqueWhere: GraphQLInputObjectType = new GraphQLInputObjectType({
					//todo this can be simplified to ${targetEntity.name}By${fieldName}, but singleton must be used
					name: GqlTypeName`${entity.name}${relation.name}By${fieldName}UniqueWhere`,
					fields: () => {
						return this.whereTypeProvider.getUniqueWhereFields(targetEntity, [[fieldName]])
					},
				})

				const entityType = this.entityTypeProvider.getEntity(targetEntity.name)

				return {
					...fields,
					[graphQlName]: {
						type: entityType,
						extensions: {
							relationName: relation.name,
						},
						args: {
							by: { type: new GraphQLNonNull(uniqueWhere) },
							filter: { type: this.whereTypeProvider.getEntityWhereType(targetEntity.name) },
						},
						resolve: aliasAwareResolver,
					},
				}
			}, {})
	}
}
