import { Input, Model } from '@contember/schema'
import { MapperFactory } from '../mapper/index.js'
import { ObjectNode } from '../inputProcessing/index.js'
import { executeReadOperations, paginate } from './ReadHelpers.js'
import { InvalidDataError } from '@contember/database'
import { UserError } from '../exception.js'

export class ReadResolver {
	constructor(
		private readonly mapperFactory: MapperFactory,
	) {}

	public async resolveQuery(queryAst: ObjectNode) {
		const mapper = this.mapperFactory.create()
		return await withInvalidDataAsUserError(() => executeReadOperations(queryAst, mapper))
	}

	public async resolveTransaction(queryAst: ObjectNode) {
		return await withInvalidDataAsUserError(() =>
			this.mapperFactory.transaction(async mapper => {
				return executeReadOperations(queryAst, mapper)
			})
		)
	}

	public async resolveListQuery(entity: Model.Entity, queryAst: ObjectNode<Input.ListQueryInput>) {
		return await withInvalidDataAsUserError(() => this.mapperFactory.create().select(entity, queryAst, []))
	}

	public async resolveGetQuery(entity: Model.Entity, queryAst: ObjectNode<Input.UniqueQueryInput>) {
		return await withInvalidDataAsUserError(() => this.mapperFactory.create().selectUnique(entity, queryAst, []))
	}

	public async resolvePaginationQuery(entity: Model.Entity, queryAst: ObjectNode<Input.PaginationQueryInput>) {
		const mapper = this.mapperFactory.create()
		return await withInvalidDataAsUserError(() => paginate(mapper, entity, queryAst))
	}
}

// A filter value PostgreSQL cannot parse is a client input error, as convertError reports it for mutations.
// Reads issued inside a mutation (its result nodes, `transaction { query }`) do not pass through here.
const withInvalidDataAsUserError = async <T>(cb: () => Promise<T>): Promise<T> => {
	try {
		return await cb()
	} catch (e) {
		if (e instanceof InvalidDataError) {
			throw new UserError(e.originalMessage, { cause: e })
		}
		throw e
	}
}
