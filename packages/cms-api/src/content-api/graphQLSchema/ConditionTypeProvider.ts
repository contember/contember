import { Model } from 'cms-common'
import { GraphQLBoolean, GraphQLEnumType, GraphQLInputObjectType, GraphQLList, GraphQLScalarType } from 'graphql'
import { GraphQLNonNull } from 'graphql/type/definition'
import singletonFactory from '../../utils/singletonFactory'
import ColumnTypeResolver from './ColumnTypeResolver'
import { GqlTypeName } from './utils'

export default class ConditionTypeProvider {
	private columnTypeResolver: ColumnTypeResolver
	private conditions = singletonFactory<GraphQLInputObjectType, string, GraphQLScalarType | GraphQLEnumType>(
		(name, type) => this.createCondition(type),
	)

	constructor(columnTypeResolver: ColumnTypeResolver) {
		this.columnTypeResolver = columnTypeResolver
	}

	public getCondition(column: Model.AnyColumnDefinition): GraphQLInputObjectType {
		const basicType = this.columnTypeResolver.getType(column)
		return this.conditions(basicType.name, basicType)
	}

	private createCondition(type: GraphQLScalarType | GraphQLEnumType): GraphQLInputObjectType {
		const suffix = type instanceof GraphQLEnumType ? 'Enum' : ''
		const condition: GraphQLInputObjectType = new GraphQLInputObjectType({
			name: GqlTypeName`${type.name}${suffix}Condition`,
			fields: () => ({
				and: { type: new GraphQLList(new GraphQLNonNull(condition)) },
				or: { type: new GraphQLList(new GraphQLNonNull(condition)) },
				not: { type: condition },

				eq: { type: type },
				null: { type: GraphQLBoolean },
				notEq: { type: type },
				in: { type: new GraphQLList(new GraphQLNonNull(type)) },
				notIn: { type: new GraphQLList(new GraphQLNonNull(type)) },
				lt: { type: type },
				lte: { type: type },
				gt: { type: type },
				gte: { type: type },
			}),
		})
		return condition
	}
}
