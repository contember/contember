import { SelectExecutionHandler, SelectExecutionHandlerContext } from '../SelectExecutionHandler'
import { Path } from '../Path'
import { Acl, Input } from '@contember/schema'
import { PredicateFactory } from '../../../acl'
import { WhereBuilder } from '../WhereBuilder'
import { ObjectNode } from '../../../inputProcessing'

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
		const { entity, path } = context
		if (entity.primary === fieldName) {
			return
		}
		const fieldPredicate = this.predicateFactory.create(entity, operation, [fieldName])
		context.addColumn(qb => {
			return this.whereBuilder.buildAdvanced(entity, path.back(), fieldPredicate, cb =>
				qb.select(
					expr =>
						expr.selectCondition(condition => {
							condition = cb(condition)
							if (condition.isEmpty()) {
								return condition.raw('true')
							}
							return condition
						}),
					metaPath.alias,
				),
			)
		}, metaPath)
	}
}
