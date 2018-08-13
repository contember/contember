import { Input, Model } from 'cms-common'
import { GraphQLError, GraphQLFieldResolver, GraphQLResolveInfo } from 'graphql'
import { Context } from '../types'
import { isUniqueWhere } from '../../content-schema/inputUtils'
import Mapper from '../sql/mapper'
import GraphQlQueryAstFactory from './GraphQlQueryAstFactory'
import ObjectNode from './ObjectNode'

export default class MutationResolver {
	constructor(private readonly schema: Model.Schema) {}

	public resolveUpdate = (entity: Model.Entity): GraphQLFieldResolver<any, Context, Input.UpdateInput> => async (
		parent: any,
		args: Input.UpdateInput,
		context: Context,
		info: GraphQLResolveInfo
	) => {
		if (!isUniqueWhere(entity, args.where)) {
			throw new GraphQLError('Input where is not unique')
		}
		const objectAst = new GraphQlQueryAstFactory().create(info)

		return await Mapper.run(this.schema, context.db, async mapper => {
			await mapper.update(entity, args.where, args.data)

			return await mapper.selectOne(entity, objectAst)
		})
	}

	public resolveCreate = (entity: Model.Entity): GraphQLFieldResolver<any, Context, Input.CreateInput> => async (
		parent: any,
		args: Input.CreateInput,
		context: Context,
		info: GraphQLResolveInfo
	) => {
		const objectAst = new GraphQlQueryAstFactory().create(info)

		return await Mapper.run(this.schema, context.db, async mapper => {
			const primary = await mapper.insert(entity, args.data)

			const whereArgs = { where: { [entity.primary]: primary } }
			const objectWithArgs = new ObjectNode<Input.UniqueQueryInput>(
				objectAst.name,
				objectAst.alias,
				objectAst.fields,
				whereArgs
			)

			return mapper.selectOne(entity, objectWithArgs)
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
		const objectAst = new GraphQlQueryAstFactory().create(info)

		return await Mapper.run(this.schema, context.db, async mapper => {
			const result = await mapper.selectOne(entity, objectAst)

			await mapper.delete(entity, args.where)

			return result
		})
	}
}
