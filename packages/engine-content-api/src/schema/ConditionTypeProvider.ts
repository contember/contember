import { Model } from '@contember/schema'
import {
	GraphQLBoolean,
	GraphQLEnumType,
	GraphQLInputFieldConfigMap,
	GraphQLInputObjectType,
	GraphQLList,
	GraphQLNonNull,
	GraphQLScalarType,
	GraphQLString,
} from 'graphql'
import { singletonFactory } from '../utils/index.js'
import { ColumnTypeResolver } from './ColumnTypeResolver.js'
import { GqlTypeName } from './utils.js'

export class ConditionTypeProvider {
	private conditions = singletonFactory<GraphQLInputObjectType, string, GraphQLScalarType | GraphQLEnumType>(
		(name, type) => this.createCondition(type),
	)

	constructor(private readonly columnTypeResolver: ColumnTypeResolver) {}

	public getCondition(column: Model.AnyColumn): GraphQLInputObjectType {
		const basicType = this.columnTypeResolver.getType(column)
		return this.conditions(basicType.name, basicType)
	}

	private createCondition(type: GraphQLScalarType | GraphQLEnumType): GraphQLInputObjectType {
		const suffix =
			typeof type === 'object' && type.constructor && type.constructor.name === 'GraphQLEnumType' ? 'Enum' : ''
		const condition: GraphQLInputObjectType = new GraphQLInputObjectType({
			name: GqlTypeName`${type.name}${suffix}Condition`,
			fields: (): GraphQLInputFieldConfigMap => {
				const conditions: GraphQLInputFieldConfigMap = {
					and: { type: new GraphQLList(new GraphQLNonNull(condition)) },
					or: { type: new GraphQLList(new GraphQLNonNull(condition)) },
					not: { type: condition },

					null: { type: GraphQLBoolean },
					isNull: { type: GraphQLBoolean },
				}
				if (type.name !== 'Json') {
					conditions.eq = { type }
					conditions.notEq = { type }
					conditions.in = { type: new GraphQLList(new GraphQLNonNull(type)) }
					conditions.notIn = { type: new GraphQLList(new GraphQLNonNull(type)) }
					conditions.lt = { type: type }
					conditions.lte = { type: type }
					conditions.gt = { type: type }
					conditions.gte = { type: type }
				}
				if (type.name === 'String') {
					conditions.contains = { type: GraphQLString }
					conditions.startsWith = { type: GraphQLString }
					conditions.endsWith = { type: GraphQLString }

					conditions.containsCI = { type: GraphQLString }
					conditions.startsWithCI = { type: GraphQLString }
					conditions.endsWithCI = { type: GraphQLString }
				}
				return conditions
			},
		})
		return condition
	}
}
