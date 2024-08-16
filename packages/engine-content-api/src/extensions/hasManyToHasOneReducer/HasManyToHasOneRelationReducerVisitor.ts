import { GraphQLInputObjectType, GraphQLNonNull } from 'graphql'
import { Acl, Model } from '@contember/schema'
import { aliasAwareResolver, EntityTypeProvider, FieldAccessVisitor, GqlTypeName, WhereTypeProvider } from '../../schema'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { Authorizator } from '../../acl'
import { getFieldsForUniqueWhere } from '../../utils'
import { HasManyToHasOneReducer, HasManyToHasOneReducerExtension } from './HasManyToHasOneReducer'
import { GraphQLFieldConfig } from 'graphql'

type Result = [
	string,
	GraphQLFieldConfig<any, any> & {
		extensions: HasManyToHasOneReducerExtension
	}
]

export class HasManyToHasOneRelationReducerFieldVisitor implements
	Model.ColumnVisitor<Result[]>,
	Model.RelationByTypeVisitor<Result[]> {

	constructor(
		private readonly schema: Model.Schema,
		private readonly authorizator: Authorizator,
		private readonly entityTypeProvider: EntityTypeProvider,
		private readonly whereTypeProvider: WhereTypeProvider,
	) {}

	public visitColumn() {
		return []
	}

	public visitOneHasOneOwning() {
		return []
	}

	public visitOneHasOneInverse() {
		return []
	}

	public visitManyHasOne() {
		return []
	}

	public visitManyHasManyInverse() {
		return []
	}

	public visitManyHasManyOwning() {
		return []
	}

	public visitOneHasMany({ entity, targetEntity, targetRelation, relation }: Model.OneHasManyContext) {
		if (!targetRelation) {
			return []
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


		const existing = new Set<string>()
		return [...composedUnique, ...singleUnique]
			.filter(field =>
				acceptFieldVisitor(
					this.schema,
					targetEntity.name,
					field,
					new FieldAccessVisitor(Acl.Operation.read, this.authorizator),
				),
			)
			.map<Result | null>(fieldName => {
				if (existing.has(fieldName)) {
					return null
				}
				existing.add(fieldName)
				const graphQlName = relation.name + GqlTypeName`By${fieldName}`
				const uniqueWhere: GraphQLInputObjectType = new GraphQLInputObjectType({
					//todo this can be simplified to ${targetEntity.name}By${fieldName}, but singleton must be used
					name: GqlTypeName`${entity.name}${relation.name}By${fieldName}UniqueWhere`,
					description: relation.description,
					fields: () => {
						return this.whereTypeProvider.getUniqueWhereFields(targetEntity, [[fieldName]])
					},
				})

				const entityType = this.entityTypeProvider.getEntity(targetEntity.name)

				return [
					graphQlName,
					{
						type: entityType,
						description: relation.description,
						extensions: {
							relationName: relation.name,
							extensionKey: HasManyToHasOneReducer.extensionName,
						},
						args: {
							by: { type: new GraphQLNonNull(uniqueWhere) },
							filter: { type: this.whereTypeProvider.getEntityWhereType(targetEntity.name) },
						},
						resolve: aliasAwareResolver,
					},
				]
			})
			.filter((it): it is Result => it !== null)
	}
}
