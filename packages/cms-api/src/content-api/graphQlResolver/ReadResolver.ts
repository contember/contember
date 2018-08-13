import { Input, Model } from 'cms-common'
import { Context } from '../types'
import { GraphQLError, GraphQLResolveInfo } from 'graphql'
import GraphQlQueryAstFactory from './GraphQlQueryAstFactory'
import { selectData, selectOne } from '../sql/mapper'
import { isUniqueWhere } from '../../content-schema/inputUtils'
import ObjectNode from './ObjectNode'

export default class ReadResolver {
	constructor(private readonly schema: Model.Schema) {}

	async resolveListQuery(
		entity: Model.Entity,
		parent: any,
		args: Input.ListQueryInput,
		context: Context,
		resolveInfo: GraphQLResolveInfo
	) {
		const objectAst = new GraphQlQueryAstFactory().create(resolveInfo)
		const objectWithArgs = new ObjectNode(objectAst.name, objectAst.alias, objectAst.fields, args)

		return await selectData(this.schema, context.db)(entity.name, objectWithArgs)
	}

	async resolveGetQuery(
		entity: Model.Entity,
		parent: any,
		args: Input.UniqueQueryInput,
		context: Context,
		resolveInfo: GraphQLResolveInfo
	) {
		if (!isUniqueWhere(entity, args.where)) {
			throw new GraphQLError('Input where is not unique')
		}
		const objectAst = new GraphQlQueryAstFactory().create(resolveInfo)
		const objectWithArgs = new ObjectNode(objectAst.name, objectAst.alias, objectAst.fields, args)

		return await selectOne(this.schema, context.db)(entity.name, objectWithArgs)
	}
}
