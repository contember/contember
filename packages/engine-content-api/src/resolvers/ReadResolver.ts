import { Input, Model } from '@contember/schema'
import { MapperFactory } from '../mapper/index.js'
import { GraphQLResolveInfo } from 'graphql'
import { GraphQlQueryAstFactory } from './GraphQlQueryAstFactory.js'
import { ObjectNode } from '../inputProcessing/index.js'
import { executeReadOperations, paginate } from './ReadHelpers.js'
import { InvalidDataError } from '@contember/database'
import { UserError } from '../exception.js'

export class ReadResolver {
	constructor(
		private readonly mapperFactory: MapperFactory,
		private readonly queryAstFactory: GraphQlQueryAstFactory,
	) {}

	public async resolveQuery(info: GraphQLResolveInfo) {
		const queryAst = this.queryAstFactory.create(info)
		const fields = GraphQlQueryAstFactory.resolveObjectType(info.returnType).getFields()
		const mapper = this.mapperFactory.create()
		return await withInvalidDataAsUserError(() => executeReadOperations(queryAst, fields, mapper))
	}

	public async resolveTransaction(info: GraphQLResolveInfo) {
		const queryAst = this.queryAstFactory.create(info)
		const fields = GraphQlQueryAstFactory.resolveObjectType(info.returnType).getFields()

		return await withInvalidDataAsUserError(() =>
			this.mapperFactory.transaction(async mapper => {
				return executeReadOperations(queryAst, fields, mapper)
			})
		)
	}

	public async resolveListQuery(entity: Model.Entity, info: GraphQLResolveInfo) {
		const queryAst: ObjectNode<Input.ListQueryInput> = this.queryAstFactory.create(info)
		return await withInvalidDataAsUserError(() => this.mapperFactory.create().select(entity, queryAst, []))
	}

	public async resolveGetQuery(entity: Model.Entity, info: GraphQLResolveInfo) {
		const queryAst: ObjectNode<Input.UniqueQueryInput> = this.queryAstFactory.create(info)
		return await withInvalidDataAsUserError(() => this.mapperFactory.create().selectUnique(entity, queryAst, []))
	}

	public async resolvePaginationQuery(entity: Model.Entity, info: GraphQLResolveInfo) {
		const queryAst: ObjectNode<Input.PaginationQueryInput> = this.queryAstFactory.create(info)
		const mapper = this.mapperFactory.create()
		return await withInvalidDataAsUserError(() => paginate(mapper, entity, queryAst))
	}
}

// A filter value PostgreSQL cannot parse is a client input error, as it is for mutations (see convertError).
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
