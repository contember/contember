import { Input, Model } from '@contember/schema'
import { MapperFactory } from '../mapper/index.js'
import { ObjectNode } from '../inputProcessing/index.js'
import { executeReadOperations, paginate } from './ReadHelpers.js'

export class ReadResolver {
	constructor(
		private readonly mapperFactory: MapperFactory,
	) {}

	public async resolveQuery(queryAst: ObjectNode) {
		const mapper = this.mapperFactory.create()
		return executeReadOperations(queryAst, mapper)
	}

	public async resolveTransaction(queryAst: ObjectNode) {
		return this.mapperFactory.transaction(async mapper => {
			return executeReadOperations(queryAst, mapper)
		})
	}

	public async resolveListQuery(entity: Model.Entity, queryAst: ObjectNode<Input.ListQueryInput>) {
		return await this.mapperFactory.create().select(entity, queryAst, [])
	}

	public async resolveGetQuery(entity: Model.Entity, queryAst: ObjectNode<Input.UniqueQueryInput>) {
		return await this.mapperFactory.create().selectUnique(entity, queryAst, [])
	}

	public async resolvePaginationQuery(entity: Model.Entity, queryAst: ObjectNode<Input.PaginationQueryInput>) {
		const mapper = this.mapperFactory.create()
		return await paginate(mapper, entity, queryAst)
	}
}
