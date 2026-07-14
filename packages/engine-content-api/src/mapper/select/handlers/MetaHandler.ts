import { SelectExecutionHandler, SelectExecutionHandlerContext } from '../SelectExecutionHandler.js'
import { Path } from '../Path.js'
import { Acl, Input } from '@contember/schema'
import { createPredicateContext, PredicateFactory } from '../../../acl/index.js'
import { WhereBuilder } from '../WhereBuilder.js'
import { ObjectNode } from '../../../inputProcessing/index.js'
import { getFieldPredicate } from '../getFieldPredicate.js'

export class MetaHandler implements SelectExecutionHandler<{}> {
	constructor(private readonly whereBuilder: WhereBuilder, private readonly predicateFactory: PredicateFactory) {}

	process(context: SelectExecutionHandlerContext): void {
		const { objectNode, path } = context
		if (!objectNode) {
			throw new Error()
		}
		for (let metaField of objectNode.fields) {
			const columnPath = path.for(metaField.alias)
			for (let metaInfo of (metaField as ObjectNode).fields) {
				if (metaInfo.name === Input.FieldMeta.updatable) {
					this.addMetaFlag(context, metaField.name, columnPath.for(metaInfo.alias), Acl.Operation.update)
				}
				if (metaInfo.name === Input.FieldMeta.readable) {
					this.addMetaFlag(context, metaField.name, columnPath.for(metaInfo.alias), Acl.Operation.read)
				}
			}
		}
	}

	private addMetaFlag(
		context: SelectExecutionHandlerContext,
		fieldName: string,
		metaPath: Path,
		operation: Acl.Operation.read | Acl.Operation.update,
	): void {
		const { entity } = context
		if (entity.primary === fieldName) {
			return
		}
		const field = entity.fields[fieldName]
		if (!field) {
			throw new Error(`Unknown field ${entity.name}.${fieldName}`)
		}
		const getValue = operation === Acl.Operation.update
			? context.addMutationPredicate(this.predicateFactory.create(
				entity,
				Acl.Operation.update,
				[field.name],
				createPredicateContext(context.relationPath.length === 0 ? 'root' : 'through'),
			))
			: context.addPredicate(getFieldPredicate(this.predicateFactory, operation, entity, field, context.relationPath).predicate)
		context.addColumn({
			path: metaPath,
			valueGetter: getValue,
		})
	}
}
