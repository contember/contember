import { Input, Model, Value } from '@contember/schema'
import { getFieldReadPredicate, RelationFetcher, SelectExecutionHandler, SelectExecutionHandlerContext } from '../../mapper/index.js'
import { PaginatedHasManyFieldProviderExtension } from './PaginatedHasManyFieldProvider.js'
import { acceptFieldVisitor, getField } from '@contember/schema-utils'
import { createPaginationHelper } from '../../utils/index.js'
import { PaginatedHasManyCountVisitor } from './PaginatedHasManyCountVisitor.js'
import { PaginatedHasManyNodesVisitor } from './PaginatedHasManyNodesVisitor.js'
import { PredicateFactory } from '../../acl/index.js'
import {
	containsUpdatableMetadata,
	createMetadataUpdateMasker,
	createRelationUpdatePredicates,
	MetadataUpdateMasker,
} from '../../mapper/select/MetadataUpdateCapability.js'

const isValueObject = (value: Value.FieldValue | undefined): value is Value.Object =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

type MutableValueObject = { [key: string]: Value.FieldValue }

const copyObject = (value: Value.Object): MutableValueObject => {
	const result: { [key: string]: Value.FieldValue } = {}
	for (const [fieldName, fieldValue] of Object.entries(value)) {
		if (fieldValue !== undefined) {
			result[fieldName] = fieldValue
		}
	}
	return result
}

const createPaginationUpdateMasker = (nodeMasker: MetadataUpdateMasker): MetadataUpdateMasker => {
	const maskObject = (value: Value.Object): Value.Object => {
		const result = copyObject(value)
		if (!Array.isArray(result.edges)) {
			return result
		}
		result.edges = result.edges.map(edge => {
			if (!isValueObject(edge)) {
				return edge
			}
			const node = edge.node
			return isValueObject(node) ? { ...copyObject(edge), node: nodeMasker.maskObject(node) } : edge
		})
		return result
	}
	const mask = (value: Value.FieldValue): Value.FieldValue => {
		if (Array.isArray(value)) {
			return value.map(mask)
		}
		return isValueObject(value) ? maskObject(value) : value
	}
	return { mask, maskObject }
}

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
		const relationContext = acceptFieldVisitor(this.schema, entity, objectNode.extensions.relationName, {
			visitRelation: context => context,
			visitColumn: (): never => {
				throw new Error('PaginatedHasManyExecutionHandler: Not applicable for a column')
			},
		})
		const pagination = createPaginationHelper(objectNode)
		const updatePredicate = containsUpdatableMetadata(objectNode)
			? createRelationUpdatePredicates(this.predicateFactory, relationContext, context.relationPath).source
			: undefined
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
			updatePredicate,
			updateMetadataMasker: updatePredicate !== undefined && pagination.nodeField !== undefined
				? createPaginationUpdateMasker(createMetadataUpdateMasker(pagination.nodeField))
				: undefined,
		})
	}
}
