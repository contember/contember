import { Input, Model } from 'cms-common'
import { Context } from '../types'
import { GraphQLFieldResolver, GraphQLResolveInfo } from 'graphql'
import GraphQlQueryAstFactory from './GraphQlQueryAstFactory'
import PredicatesInjector from '../../acl/PredicatesInjector'
import UniqueWhereExpander from './UniqueWhereExpander'
import ObjectNode from './ObjectNode'
import MapperRunner from "../sql/MapperRunner";

export default class ReadResolver {
	constructor(
		private readonly mapperRunner: MapperRunner,
		private readonly predicatesInjector: PredicatesInjector,
		private readonly uniqueWhereExpander: UniqueWhereExpander
	) {
	}

	public resolveListQuery = (entity: Model.Entity): GraphQLFieldResolver<any, Context, Input.ListQueryInput> => async (
		parent: any,
		args: Input.ListQueryInput,
		context: Context,
		resolveInfo: GraphQLResolveInfo
	) => {
		const queryAst = new GraphQlQueryAstFactory().create(resolveInfo)
		const queryWithPredicates = this.predicatesInjector.inject(entity, queryAst, context.identityVariables)

		return await this.mapperRunner.run(context.db, context.identityVariables, async mapper => {
			return await mapper.select(entity, queryWithPredicates)
		})
	}

	public resolveGetQuery = (entity: Model.Entity): GraphQLFieldResolver<any, Context, Input.UniqueQueryInput> => async (
		parent: any,
		args: Input.UniqueQueryInput,
		context: Context,
		resolveInfo: GraphQLResolveInfo
	) => {
		const queryAst = new GraphQlQueryAstFactory().create(resolveInfo)
		const whereExpanded = this.uniqueWhereExpander.expand(entity, args.where)
		const queryExpanded = new ObjectNode(queryAst.name, queryAst.alias, queryAst.fields, {
			...queryAst.args,
			where: whereExpanded
		})
		const queryExpandedWithPredicates = this.predicatesInjector.inject(entity, queryExpanded, context.identityVariables)

		return await this.mapperRunner.run(context.db, context.identityVariables, async mapper => {
			return (await mapper.select(entity, queryExpandedWithPredicates))[0] || null
		})
	}
}
