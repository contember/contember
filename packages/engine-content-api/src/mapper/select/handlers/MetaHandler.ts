import { SelectExecutionHandler, SelectExecutionHandlerContext } from '../SelectExecutionHandler.js'
import { Path } from '../Path.js'
import { Acl, Input } from '@contember/schema'
import { PredicateFactory } from '../../../acl/index.js'
import { WhereBuilder } from '../WhereBuilder.js'
import { ObjectNode } from '../../../inputProcessing/index.js'

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
		// `readable` is context-aware: through a relation it must use the through-inclusive `all` set,
		// mirroring value masking in FieldsVisitor. `updatable` stays root-only because update
		// enforcement (Updater/InsertBuilder/…) is not context-aware — through-permissions are read-scoped.
		// The predicate REFERENCE and its definition must come from the same set, hence `rootOnly` below.
		const isRead = operation === Acl.Operation.read
		const fieldPredicate = isRead
			? this.predicateFactory.getFieldReadPredicate(entity, fieldName, context.relationPath)
			: this.predicateFactory.getFieldPredicate(entity, operation, fieldName)
		context.addColumn({
			path: metaPath,
			valueGetter: context.addPredicate(fieldPredicate.predicate, { rootOnly: !isRead }),
		})
	}
}
