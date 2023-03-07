import { Input, Model } from '@contember/schema'
import { Mapper } from '../mapper'
import { ObjectNode } from '../inputProcessing'
import { assertNever, createPaginationHelper } from '../utils'
import { ImplementationException } from '../exception'
import { GraphQLFieldMap } from 'graphql'
import { getReadOperationInfo } from '../schema'

export const paginate = async (
	mapper: Mapper,
	entity: Model.Entity,
	queryAst: ObjectNode<Input.PaginationQueryInput>,
) => {
	const paginationHelper = createPaginationHelper(queryAst)
	const totalCount = paginationHelper.requiresTotalCount
		? await mapper.count(entity, queryAst.args.filter || {})
		: undefined
	const nodes = paginationHelper.nodeField ? await mapper.select(entity, paginationHelper.nodeField, []) : undefined

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
		const info = getReadOperationInfo(fieldConfig.extensions)
		trxResult[field.alias] = await (() => {
			switch (info.operation) {
				case 'get':
					return mapper.selectUnique(info.entity, field, [])
				case 'list':
					return mapper.select(info.entity, field, [])
				case 'paginate':
					return paginate(mapper, info.entity, field)
			}
			return assertNever(info.operation)
		})()
	}
	return trxResult
}
