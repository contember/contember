import { Model } from '@contember/schema'
import { GraphQLEnumType, GraphQLInputObjectType, GraphQLScalarType } from 'graphql'
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
			fields: () => ({
				and: { type: this.graphqlObjectFactories.createList(this.graphqlObjectFactories.createNotNull(condition)) },
				or: { type: this.graphqlObjectFactories.createList(this.graphqlObjectFactories.createNotNull(condition)) },
				not: { type: condition },

				eq: { type: type },
				null: { type: this.graphqlObjectFactories.boolean },
				notEq: { type: type },
				in: { type: this.graphqlObjectFactories.createList(this.graphqlObjectFactories.createNotNull(type)) },
				notIn: { type: this.graphqlObjectFactories.createList(this.graphqlObjectFactories.createNotNull(type)) },
				lt: { type: type },
				lte: { type: type },
				gt: { type: type },
				gte: { type: type },
			}),
		})
		return condition
	}
}
