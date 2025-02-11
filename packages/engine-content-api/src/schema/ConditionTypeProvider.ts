import { Model } from '@contember/schema'
import {
	GraphQLBoolean,
	GraphQLEnumType,
	GraphQLInputFieldConfigMap,
	GraphQLInputObjectType,
	GraphQLInt,
	GraphQLList,
	GraphQLNonNull,
	GraphQLScalarType,
	GraphQLString,
} from 'graphql'
import { singletonFactory } from '../utils'
import { ColumnTypeResolver } from './ColumnTypeResolver'
import { GqlTypeName } from './utils'
import { ImplementationException } from '../exception'

export class ConditionTypeProvider {
	private conditions = singletonFactory<GraphQLInputObjectType, string, [GraphQLScalarType | GraphQLEnumType, Model.AnyColumn]>(
		(name, [type, column]) => this.createCondition(name, column, type),
	)

	constructor(private readonly columnTypeResolver: ColumnTypeResolver) {}

	public getCondition(column: Model.AnyColumn): GraphQLInputObjectType {
		const [graphqlType, baseType] = this.columnTypeResolver.getType(column)
		const name = this.createName(column, baseType.name)
		return this.conditions(name, [baseType, column])
	}

	private createName(column: Model.AnyColumn, typeName: string): string {
		const suffix = column.type === Model.ColumnType.Enum ? 'Enum' : ''
		const arraySuffix = column.list ? 'List' : ''
		return GqlTypeName`${typeName}${suffix}${arraySuffix}Condition`
	}

	private createCondition(name: string, column: Model.AnyColumn, type: GraphQLScalarType | GraphQLEnumType): GraphQLInputObjectType {
		const condition: GraphQLInputObjectType = new GraphQLInputObjectType({
			name: name,
			fields: (): GraphQLInputFieldConfigMap => {
				const conditions: GraphQLInputFieldConfigMap = {
					and: { type: new GraphQLList(new GraphQLNonNull(condition)) },
					or: { type: new GraphQLList(new GraphQLNonNull(condition)) },
					not: { type: condition },

					null: { type: GraphQLBoolean },
					isNull: { type: GraphQLBoolean },
				}
				if (column.list) {
					conditions.minLength = { type: GraphQLInt }
					conditions.maxLength = { type: GraphQLInt }
					conditions.includes = { type: type }
				} else {
					if (column.type !== Model.ColumnType.Json) {
						conditions.eq = { type }
						conditions.notEq = { type }
						conditions.in = { type: new GraphQLList(new GraphQLNonNull(type)) }
						conditions.notIn = { type: new GraphQLList(new GraphQLNonNull(type)) }
						conditions.lt = { type: type }
						conditions.lte = { type: type }
						conditions.gt = { type: type }
						conditions.gte = { type: type }
					}
					if (column.type === Model.ColumnType.String) {
						conditions.contains = { type: GraphQLString }
						conditions.startsWith = { type: GraphQLString }
						conditions.endsWith = { type: GraphQLString }

						conditions.containsCI = { type: GraphQLString }
						conditions.startsWithCI = { type: GraphQLString }
						conditions.endsWithCI = { type: GraphQLString }
					}
				}


				return conditions
			},
		})
		return condition
	}
}
