import { Model } from '@contember/schema'
import { GraphQLBoolean, GraphQLEnumType, GraphQLFieldConfig, GraphQLObjectType } from 'graphql'
import { Context } from '../types'
import { Authorizator } from '../acl'

export class RefreshViewMutationProvider {
	constructor(
		private readonly schema: Model.Schema,
		private readonly authorizator: Authorizator,
	) {
	}
	getMutation(): GraphQLFieldConfig<any, Context, any> | undefined {
		const materializedViews = Object.values(this.schema.entities)
			.filter(it => it.view?.materialized)
			.filter(it => this.authorizator.isRefreshMaterializedViewAllowed(it.name))
		if (materializedViews.length === 0) {
			return undefined
		}

		const materializedViewsEnum = new GraphQLEnumType({
			name: '_MaterializedView',
			values: Object.fromEntries(materializedViews.map(it => [it.name, { value: it.name }])),
		})

		return {
			type: new GraphQLObjectType({
				name: 'RefreshMaterializedViewResponse',
				fields: {
					ok: { type: GraphQLBoolean },
				},
			}),
			args: {
				name: { type: materializedViewsEnum },
			},
			resolve: async (parent, args, context) => {
				return await context.executionContainer.refreshViewResolver.resolve(args.name)
			},
		}
	}
}
