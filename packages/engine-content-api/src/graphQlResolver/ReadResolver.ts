import { Input, Model } from '@contember/schema'
import Mapper from '../sql/Mapper'
import { GraphQLObjectType, GraphQLResolveInfo } from 'graphql'
import GraphQlQueryAstFactory from './GraphQlQueryAstFactory'
import { ImplementationException } from '../exception'
import { Client, Connection } from '@contember/database'
import { Operation, readOperationMeta } from '../graphQLSchema/OperationExtension'
import { assertNever } from '../utils'
import { ObjectNode } from '../inputProcessing'

export default class ReadResolver {
	constructor(
		private readonly db: Client,
		private readonly mapperFactory: Mapper.Factory,
		private readonly queryAstFactory: GraphQlQueryAstFactory,
	) {}

	public async resolveTransaction(info: GraphQLResolveInfo) {
		const queryAst = this.queryAstFactory.create(info)
		const fields = (info.returnType as GraphQLObjectType).getFields()

		return this.db.transaction(async trx => {
			await trx.connection.query(Connection.REPEATABLE_READ)
			const mapper = this.mapperFactory(trx)
			const trxResult: Record<string, any> = {}

			// todo execute in parallel
			for (const field of queryAst.fields) {
				if (!(field instanceof ObjectNode)) {
					throw new ImplementationException()
				}
				const fieldConfig = fields[field.name]
				const meta = readOperationMeta(fieldConfig.extensions)
				trxResult[field.alias] = await (() => {
					switch (meta.operation) {
						case Operation.get:
							return mapper.selectUnique(meta.entity, field)
						case Operation.list:
							return mapper.select(meta.entity, field)
						case Operation.paginate:
							return this.doPaginate(mapper, meta.entity, field)
						case Operation.create:
						case Operation.update:
						case Operation.delete:
							throw new ImplementationException()
					}
					return assertNever(meta.operation)
				})()
			}
			return trxResult
		})
	}

	public async resolveListQuery(entity: Model.Entity, info: GraphQLResolveInfo) {
		const queryAst: ObjectNode<Input.ListQueryInput> = this.queryAstFactory.create(info)
		return await this.mapperFactory(this.db).select(entity, queryAst)
	}

	public async resolveGetQuery(entity: Model.Entity, info: GraphQLResolveInfo) {
		const queryAst: ObjectNode<Input.UniqueQueryInput> = this.queryAstFactory.create(info)
		return await this.mapperFactory(this.db).selectUnique(entity, queryAst)
	}

	public async resolvePaginationQuery(entity: Model.Entity, info: GraphQLResolveInfo) {
		const queryAst: ObjectNode<Input.SelectQueryInput> = this.queryAstFactory.create(info)
		const mapper = this.mapperFactory(this.db)
		return await this.doPaginate(mapper, entity, queryAst)
	}

	private async doPaginate(mapper: Mapper, entity: Model.Entity, queryAst: ObjectNode<Input.SelectQueryInput>) {
		const pageInfoField = queryAst.findFieldByName('pageInfo')
		const result: any = {}

		if (pageInfoField.length > 0) {
			result.pageInfo = {
				totalCount: await mapper.count(entity, queryAst.args.filter || {}),
			}
		}

		const edges = queryAst.findFieldByName('edges')
		if (edges.length > 1) {
			throw new Error('You cannot fetch edges more than once')
		}
		for (const edgeField of edges) {
			result[edgeField.alias] = {}
			const nodes = (edgeField as ObjectNode).findFieldByName('node')
			if (nodes.length > 1) {
				throw new Error('You cannot fetch node more than once')
			}
			for (const nodeField of nodes) {
				result[edgeField.alias] = (
					await mapper.select(
						entity,
						(nodeField as ObjectNode).withArgs({
							filter: queryAst.args.filter,
							orderBy: queryAst.args.orderBy,
							limit: queryAst.args.first,
							offset: queryAst.args.skip,
						}),
					)
				).map(it => ({ [nodeField.alias]: it }))
			}
		}
		return result
	}
}
