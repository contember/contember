import { Input, Model } from 'cms-common'
import { Context } from '../types'
import { GraphQLFieldResolver, GraphQLResolveInfo } from 'graphql'
import GraphQlQueryAstFactory from './GraphQlQueryAstFactory'
import Mapper from '../sql/mapper'
import PredicatesInjector from '../../acl/PredicatesInjector'

export default class ReadResolver {
	constructor(private readonly schema: Model.Schema, private readonly predicatesInjector: PredicatesInjector) {}

	public resolveListQuery = (entity: Model.Entity): GraphQLFieldResolver<any, Context, Input.ListQueryInput> => async (
		parent: any,
		args: Input.ListQueryInput,
		context: Context,
		resolveInfo: GraphQLResolveInfo
	) => {
		const objectAst = new GraphQlQueryAstFactory().create(resolveInfo)
		const objectWithPredicates = this.predicatesInjector.inject(entity, objectAst, context.identityVariables)

		return await Mapper.run(this.schema, context.db, async mapper => {
			return await mapper.select(entity, objectWithPredicates)
		})
	}

	public resolveGetQuery = (entity: Model.Entity): GraphQLFieldResolver<any, Context, Input.UniqueQueryInput> => async (
		parent: any,
		args: Input.UniqueQueryInput,
		context: Context,
		resolveInfo: GraphQLResolveInfo
	) => {
		const objectAst = new GraphQlQueryAstFactory().create(resolveInfo)

		return await Mapper.run(this.schema, context.db, async mapper => {
			return await mapper.selectOne(entity, objectAst)
		})
	}
}
