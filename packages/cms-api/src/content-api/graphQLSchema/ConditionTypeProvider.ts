import { Model } from 'cms-common'
import { GraphQLBoolean, GraphQLInputObjectType, GraphQLList } from 'graphql'
import { GraphQLNonNull } from 'graphql/type/definition'
import singletonFactory from '../../utils/singletonFactory'
import ColumnTypeResolver from './ColumnTypeResolver'
import { GqlTypeName } from './utils'

export default class ConditionTypeProvider {
	private columnTypeResolver: ColumnTypeResolver
	private conditions = singletonFactory<GraphQLInputObjectType, Model.AnyColumn>(column => this.createCondition(column))

	constructor(columnTypeResolver: ColumnTypeResolver) {
		this.columnTypeResolver = columnTypeResolver
	}

	public getCondition(column: Model.AnyColumn): GraphQLInputObjectType {
		return this.conditions(column)
	}

	private createCondition(column: Model.AnyColumn) {
		const basicType = this.columnTypeResolver.getType(column)

		const condition: GraphQLInputObjectType = new GraphQLInputObjectType({
			name: GqlTypeName`${column.name}Condition`,
			fields: () => ({
				and: { type: new GraphQLList(new GraphQLNonNull(condition)) },
				or: { type: new GraphQLList(new GraphQLNonNull(condition)) },
				not: { type: condition },

				eq: { type: basicType },
				null: { type: GraphQLBoolean },
				notEq: { type: basicType },
				in: { type: new GraphQLList(new GraphQLNonNull(basicType)) },
				notIn: { type: new GraphQLList(new GraphQLNonNull(basicType)) },
				lt: { type: basicType },
				lte: { type: basicType },
				gt: { type: basicType },
				gte: { type: basicType }
			})
		})
		return condition
	}
}
