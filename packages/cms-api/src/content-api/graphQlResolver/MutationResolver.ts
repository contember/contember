import { Input, Model } from 'cms-common'
import { GraphQLError, GraphQLFieldResolver, GraphQLResolveInfo } from 'graphql'
import { Context } from '../types'
import { isUniqueWhere } from '../../content-schema/inputUtils'
import GraphQlQueryAstFactory from './GraphQlQueryAstFactory'
import ObjectNode from './ObjectNode'
import UniqueWhereExpander from './UniqueWhereExpander'
import MapperRunner from "../sql/MapperRunner";

export default class MutationResolver {
	constructor(
		private readonly mapperRunner: MapperRunner,
		private readonly uniqueWhereExpander: UniqueWhereExpander
	) {
	}

	public resolveUpdate = (entity: Model.Entity): GraphQLFieldResolver<any, Context, Input.UpdateInput> => async (
		parent: any,
		args: Input.UpdateInput,
		context: Context,
		info: GraphQLResolveInfo
	) => {
		if (!isUniqueWhere(entity, args.where)) {
			throw new GraphQLError('Input where is not unique')
		}
		const queryAst = new GraphQlQueryAstFactory().create<Input.UpdateInput>(info)
		const whereExpanded = this.uniqueWhereExpander.expand(entity, args.where)
		const queryExpanded = queryAst.withArg<Input.ListQueryInput>('where', whereExpanded)

		return await this.mapperRunner.run(context.db, context.identityVariables, async mapper => {
			await mapper.update(entity, args.where, args.data)

			return (await mapper.select(entity, queryExpanded))[0] || null
		})
	}

	public resolveCreate = (entity: Model.Entity): GraphQLFieldResolver<any, Context, Input.CreateInput> => async (
		parent: any,
		args: Input.CreateInput,
		context: Context,
		info: GraphQLResolveInfo
	) => {
		const objectAst = new GraphQlQueryAstFactory().create(info)

		return await this.mapperRunner.run(context.db, context.identityVariables, async mapper => {
			const primary = await mapper.insert(entity, args.data)

			const whereArgs = {where: {[entity.primary]: {eq: primary}}}
			const objectWithArgs = new ObjectNode<Input.ListQueryInput>(
				objectAst.name,
				objectAst.alias,
				objectAst.fields,
				whereArgs
			)

			return (await mapper.select(entity, objectWithArgs))[0] || null
		})
	}

	public resolveDelete = (entity: Model.Entity): GraphQLFieldResolver<any, Context, Input.DeleteInput> => async (
		parent: any,
		args: Input.DeleteInput,
		context: Context,
		info: GraphQLResolveInfo
	) => {
		if (!isUniqueWhere(entity, args.where)) {
			throw new GraphQLError('Input where is not unique')
		}
		const queryAst = new GraphQlQueryAstFactory().create<Input.DeleteInput>(info)
		const whereExpanded = this.uniqueWhereExpander.expand(entity, args.where)
		const queryExpanded = queryAst.withArg<Input.ListQueryInput>('where', whereExpanded)

		return await this.mapperRunner.run(context.db, context.identityVariables,async mapper => {
			const result = (await mapper.select(entity, queryExpanded))[0] || null

			await mapper.delete(entity, args.where)

			return result
		})
	}
}
