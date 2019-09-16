import { Input, Model } from '@contember/schema'
import ObjectNode from './ObjectNode'
import Mapper from '../sql/Mapper'
import { GraphQLObjectType, GraphQLResolveInfo } from 'graphql'
import GraphQlQueryAstFactory from './GraphQlQueryAstFactory'
import { ImplementationException } from '../exception'

export default class ReadResolver {
	constructor(private readonly mapper: Mapper, private readonly queryAstFactory: GraphQlQueryAstFactory) {}

	public async resolveTransaction(info: GraphQLResolveInfo) {
		const queryAst = this.queryAstFactory.create(info)
		const fields = (info.returnType as GraphQLObjectType).getFields()

		const trxResult: Record<string, any> = {}

		// todo execute in parallel
		for (const field of queryAst.fields) {
			if (!(field instanceof ObjectNode)) {
				throw new ImplementationException()
			}
			const fieldConfig = fields[field.name]
			const extra = fieldConfig.extensions || {}
			if (!extra.operation || !extra.entity) {
				throw new ImplementationException()
			}

			let result: any
			switch (extra.operation) {
				case 'list':
					result = await this.mapper.select(extra.entity, field)
					break
				case 'get':
					result = await this.mapper.selectUnique(extra.entity, field)
					break
				default:
					throw new ImplementationException()
			}
			trxResult[field.alias] = result
		}
		return trxResult
	}

	public async resolveListQuery(entity: Model.Entity, info: GraphQLResolveInfo) {
		const queryAst: ObjectNode<Input.ListQueryInput> = this.queryAstFactory.create(info)
		return await this.mapper.select(entity, queryAst)
	}

	public async resolveGetQuery(entity: Model.Entity, info: GraphQLResolveInfo) {
		const queryAst: ObjectNode<Input.UniqueQueryInput> = this.queryAstFactory.create(info)
		return this.mapper.selectUnique(entity, queryAst)
	}
}
