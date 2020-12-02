import { GraphQLFieldMap, GraphQLInputObjectType } from 'graphql'
import { Acl, Model } from '@contember/schema'
import EntityTypeProvider from '../../graphQLSchema/EntityTypeProvider'
import WhereTypeProvider from '../../graphQLSchema/WhereTypeProvider'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { FieldAccessVisitor } from '../../graphQLSchema/FieldAccessVisitor'
import Authorizator from '../../acl/Authorizator'
import { aliasAwareResolver, GqlTypeName } from '../../graphQLSchema/utils'
import { Accessor } from '../../utils'
import HasManyToHasOneReducer from './HasManyToHasOneReducer'
import EntityFieldsProvider from '../EntityFieldsProvider'
import { GraphQLObjectsFactory } from '@contember/graphql-utils'
import { getFieldsForUniqueWhere } from '../../utils/uniqueWhereFields'

class HasManyToHasOneRelationReducerFieldVisitor
	implements
		Model.ColumnVisitor<EntityFieldsProvider.FieldMap<HasManyToHasOneReducer.Extension>>,
		Model.RelationByTypeVisitor<EntityFieldsProvider.FieldMap<HasManyToHasOneReducer.Extension>> {
	constructor(
		private readonly schema: Model.Schema,
		private readonly authorizator: Authorizator,
		private readonly entityTypeProviderAccessor: Accessor<EntityTypeProvider>,
		private readonly whereTypeProvider: WhereTypeProvider,
		private readonly graphqlObjectFactories: GraphQLObjectsFactory,
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
			.reduce<EntityFieldsProvider.FieldMap<HasManyToHasOneReducer.Extension>>((fields, fieldName) => {
				const graphQlName = relation.name + GqlTypeName`By${fieldName}`
				const uniqueWhere: GraphQLInputObjectType = this.graphqlObjectFactories.createInputObjectType({
					//todo this can be simplified to ${targetEntity.name}By${fieldName}, but singleton must be used
					name: GqlTypeName`${entity.name}${relation.name}By${fieldName}UniqueWhere`,
					fields: () => {
						return this.whereTypeProvider.getUniqueWhereFields(targetEntity, [[fieldName]])
					},
				})

				const entityType = this.entityTypeProviderAccessor.get().getEntity(targetEntity.name)

				return {
					...fields,
					[graphQlName]: {
						type: entityType,
						extensions: {
							relationName: relation.name,
						},
						args: {
							by: { type: this.graphqlObjectFactories.createNotNull(uniqueWhere) },
							filter: { type: this.whereTypeProvider.getEntityWhereType(targetEntity.name) },
						},
						resolve: aliasAwareResolver,
					},
				}
			}, {})
	}
}

export default HasManyToHasOneRelationReducerFieldVisitor
