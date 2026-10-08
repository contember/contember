import { Input, Model } from '@contember/schema'
import { getFieldReadPredicate, RelationFetcher, SelectExecutionHandler, SelectExecutionHandlerContext } from '../../mapper/index.js'
import { PaginatedHasManyFieldProviderExtension } from './PaginatedHasManyFieldProvider.js'
import { acceptFieldVisitor, getField } from '@contember/schema-utils'
import { createPaginationHelper } from '../../utils/index.js'
import { PaginatedHasManyCountVisitor } from './PaginatedHasManyCountVisitor.js'
import { PaginatedHasManyNodesVisitor } from './PaginatedHasManyNodesVisitor.js'
import { PredicateFactory } from '../../acl/index.js'

export class PaginatedHasManyExecutionHandler implements SelectExecutionHandler<Input.PaginationQueryInput, PaginatedHasManyFieldProviderExtension> {
	constructor(
		private readonly schema: Model.Schema,
		private readonly relationFetcher: RelationFetcher,
		private readonly predicateFactory: PredicateFactory,
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
			predicate: getFieldReadPredicate(
				this.predicateFactory,
				entity,
				getField(entity, objectNode.extensions.relationName),
				context.relationPath,
			),
		})
	}
}
