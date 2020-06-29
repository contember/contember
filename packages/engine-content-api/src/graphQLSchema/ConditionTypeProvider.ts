import { Model } from '@contember/schema'
import { GraphQLEnumType, GraphQLInputFieldConfigMap, GraphQLInputObjectType, GraphQLScalarType } from 'graphql'
import singletonFactory from '../utils/singletonFactory'
import ColumnTypeResolver from './ColumnTypeResolver'
import { GqlTypeName } from './utils'
import { GraphQLObjectsFactory } from './GraphQLObjectsFactory'

export default class ConditionTypeProvider {
	private conditions = singletonFactory<GraphQLInputObjectType, string, GraphQLScalarType | GraphQLEnumType>(
		(name, type) => this.createCondition(type),
	)

	constructor(
		private readonly columnTypeResolver: ColumnTypeResolver,
		private readonly graphqlObjectFactories: GraphQLObjectsFactory,
	) {}

	public getCondition(column: Model.AnyColumnDefinition): GraphQLInputObjectType {
		const basicType = this.columnTypeResolver.getType(column)
		return this.conditions(basicType.name, basicType)
	}

	private createCondition(type: GraphQLScalarType | GraphQLEnumType): GraphQLInputObjectType {
		const suffix =
			typeof type === 'object' && type.constructor && type.constructor.name === 'GraphQLEnumType' ? 'Enum' : ''
		const condition: GraphQLInputObjectType = this.graphqlObjectFactories.createInputObjectType({
			name: GqlTypeName`${type.name}${suffix}Condition`,
			fields: (): GraphQLInputFieldConfigMap => {
				const conditions: GraphQLInputFieldConfigMap = {
					and: { type: this.graphqlObjectFactories.createList(this.graphqlObjectFactories.createNotNull(condition)) },
					or: { type: this.graphqlObjectFactories.createList(this.graphqlObjectFactories.createNotNull(condition)) },
					not: { type: condition },

					eq: { type: type },
					null: { type: this.graphqlObjectFactories.boolean },
					isNull: { type: this.graphqlObjectFactories.boolean },
					notEq: { type: type },
					in: { type: this.graphqlObjectFactories.createList(this.graphqlObjectFactories.createNotNull(type)) },
					notIn: { type: this.graphqlObjectFactories.createList(this.graphqlObjectFactories.createNotNull(type)) },
					lt: { type: type },
					lte: { type: type },
					gt: { type: type },
					gte: { type: type },
				}
				if (type.name === 'String') {
					conditions.contains = { type: this.graphqlObjectFactories.string }
					conditions.startsWith = { type: this.graphqlObjectFactories.string }
					conditions.endsWith = { type: this.graphqlObjectFactories.string }
				}
				return conditions
			},
		})
		return condition
	}
}
