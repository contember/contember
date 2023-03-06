import { Input, Model } from '@contember/schema'
import { MapperFactory } from '../mapper'
import { GraphQLResolveInfo } from 'graphql'
import { GraphQlQueryAstFactory } from './GraphQlQueryAstFactory'
import { ObjectNode } from '../inputProcessing'
import { executeReadOperations, paginate } from './ReadHelpers'

export class ReadResolver {
	constructor(
		private readonly mapperFactory: MapperFactory,
		private readonly queryAstFactory: GraphQlQueryAstFactory,
	) {}

	public async resolveQuery(info: GraphQLResolveInfo) {
		const queryAst = this.queryAstFactory.create(info)
		const fields = GraphQlQueryAstFactory.resolveObjectType(info.returnType).getFields()
		const mapper = this.mapperFactory.create()
		return executeReadOperations(queryAst, fields, mapper)
	}

	public async resolveTransaction(info: GraphQLResolveInfo) {
		const queryAst = this.queryAstFactory.create(info)
		const fields = GraphQlQueryAstFactory.resolveObjectType(info.returnType).getFields()

		return this.mapperFactory.transaction(async mapper => {
			return executeReadOperations(queryAst, fields, mapper)
		})
	}

	public async resolveListQuery(entity: Model.Entity, info: GraphQLResolveInfo) {
		const queryAst: ObjectNode<Input.ListQueryInput> = this.queryAstFactory.create(info)
		return await this.mapperFactory.create().select(entity, queryAst, [])
	}

	public async resolveGetQuery(entity: Model.Entity, info: GraphQLResolveInfo) {
		const queryAst: ObjectNode<Input.UniqueQueryInput> = this.queryAstFactory.create(info)
		return await this.mapperFactory.create().selectUnique(entity, queryAst, [])
	}

	public async resolvePaginationQuery(entity: Model.Entity, info: GraphQLResolveInfo) {
		const queryAst: ObjectNode<Input.PaginationQueryInput> = this.queryAstFactory.create(info)
		const mapper = this.mapperFactory.create()
		return await paginate(mapper, entity, queryAst)
	}
}
