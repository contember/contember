import { Input, Model } from '@contember/schema'
import ObjectNode from './ObjectNode'
import Mapper from '../sql/Mapper'
import { GraphQLResolveInfo } from 'graphql'
import GraphQlQueryAstFactory from './GraphQlQueryAstFactory'

export default class ReadResolver {
	constructor(private readonly mapper: Mapper, private readonly queryAstFactory: GraphQlQueryAstFactory) {}

	public async resolveListQuery(entity: Model.Entity, info: GraphQLResolveInfo) {
		const queryAst: ObjectNode<Input.ListQueryInput> = this.queryAstFactory.create(info)
		return await this.mapper.select(entity, queryAst)
	}

	public async resolveGetQuery(entity: Model.Entity, info: GraphQLResolveInfo) {
		const queryAst: ObjectNode<Input.UniqueQueryInput> = this.queryAstFactory.create(info)
		return this.mapper.selectUnique(entity, queryAst)
	}
}
