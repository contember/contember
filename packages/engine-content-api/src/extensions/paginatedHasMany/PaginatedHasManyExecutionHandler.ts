import { Input, Model } from '@contember/schema'
import { RelationFetcher, SelectExecutionHandler, SelectExecutionHandlerContext } from '../../mapper'
import { PaginatedHasManyFieldProviderExtension } from './PaginatedHasManyFieldProvider'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { createPaginationHelper } from '../../utils'
import { PaginatedHasManyCountVisitor } from './PaginatedHasManyCountVisitor'
import { PaginatedHasManyNodesVisitor } from './PaginatedHasManyNodesVisitor'

export class PaginatedHasManyExecutionHandler implements SelectExecutionHandler<Input.PaginationQueryInput, PaginatedHasManyFieldProviderExtension> {
	constructor(
		private readonly schema: Model.Schema,
		private readonly relationFetcher: RelationFetcher,
	) {}

	process(
		context: SelectExecutionHandlerContext<Input.PaginationQueryInput, PaginatedHasManyFieldProviderExtension>,
	): void {
		const { addData, entity, objectNode, mapper } = context
		if (!objectNode) {
			throw new Error()
		}
		const pagination = createPaginationHelper(objectNode)
		addData({
			field: context.entity.primary,
			dataProvider: async ids => {
				const counts = pagination.requiresTotalCount
					? await acceptFieldVisitor(
						this.schema,
						entity,
						objectNode.extensions.relationName,
						new PaginatedHasManyCountVisitor(ids, objectNode, this.relationFetcher, mapper, context.relationPath),
					  )
					: {}

				const nodes = pagination.nodeField
					? await acceptFieldVisitor(
						this.schema,
						entity,
						objectNode.extensions.relationName,
						new PaginatedHasManyNodesVisitor(ids, pagination.nodeField, this.relationFetcher, mapper, context.relationPath),
					  )
					: undefined
				const result = new Map<Input.PrimaryValue, any>()
				for (const id of ids) {
					result.set(id, pagination.createResponse(counts?.[id] ?? 0, nodes?.[id] ?? []))
				}
				return Object.fromEntries(result)
			},
			defaultValue: pagination.createResponse(0, []),
		})
	}
}
