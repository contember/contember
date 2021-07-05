import { Input, Model } from '@contember/schema'
import { Mapper } from '../mapper'
import { ObjectNode } from '../inputProcessing'
import { assertNever, createPaginationHelper } from '../utils'
import { ImplementationException } from '../exception'
import { Operation, readOperationMeta } from '../schema'
import { GraphQLFieldMap } from 'graphql'

export const paginate = async (
	mapper: Mapper,
	entity: Model.Entity,
	queryAst: ObjectNode<Input.PaginationQueryInput>,
) => {
	const paginationHelper = createPaginationHelper(queryAst)
	const totalCount = paginationHelper.requiresTotalCount
		? await mapper.count(entity, queryAst.args.filter || {})
		: undefined
	const nodes = paginationHelper.nodeField ? await mapper.select(entity, paginationHelper.nodeField) : undefined

	return paginationHelper.createResponse(totalCount, nodes)
}

export const executeReadOperations = async (
	queryAst: ObjectNode,
	fields: GraphQLFieldMap<any, any>,
	mapper: Mapper,
): Promise<Record<string, any>> => {
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
					return paginate(mapper, meta.entity, field)
				case Operation.create:
				case Operation.update:
				case Operation.delete:
				case Operation.upsert:
					throw new ImplementationException()
			}
			return assertNever(meta.operation)
		})()
	}
	return trxResult
}
