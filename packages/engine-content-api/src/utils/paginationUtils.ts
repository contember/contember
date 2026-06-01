import { ObjectNode } from '../inputProcessing/index.js'
import { Input } from '@contember/schema'

export class PaginationHelper {
	constructor(
		public readonly pageInfoField: ObjectNode | undefined,
		public readonly nodeField: ObjectNode | undefined,
	) {}

	get requiresTotalCount() {
		return this.pageInfoField !== undefined
	}

	get requiresNodes() {
		return this.nodeField !== undefined
	}

	public createResponse(totalCount?: number, nodes?: Record<string, any>[]): any {
		const hasTotalCount = totalCount !== undefined
		if (this.requiresTotalCount && !hasTotalCount) {
			throw new Error('totalCount is required')
		}
		const hasNodes = nodes !== undefined
		if (this.requiresNodes && !hasNodes) {
			throw new Error('nodes are required')
		}
		return {
			pageInfo: { totalCount },
			edges: nodes?.map(it => ({ node: it })),
		}
	}
}
export const createPaginationHelper = (queryAst: ObjectNode<Input.PaginationQueryInput>) => {
	const pageInfoField = queryAst.findFieldByName('pageInfo')[0] as ObjectNode | undefined

	const edges = queryAst.findFieldByName('edges')
	if (edges.length > 1) {
		throw new Error('You cannot fetch edges more than once')
	}
	const edgeField = edges?.[0] as ObjectNode | undefined
	const nodes = edgeField?.findFieldByName('node') || []
	if (nodes.length > 1) {
		throw new Error('You cannot fetch node more than once')
	}
	const nodeField = (nodes?.[0] as ObjectNode | undefined)?.withArgs({
		filter: queryAst.args.filter,
		orderBy: queryAst.args.orderBy,
		limit: queryAst.args.first,
		offset: queryAst.args.skip,
	})
	return new PaginationHelper(pageInfoField, nodeField)
}
