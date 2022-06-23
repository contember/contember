import { Input, Model } from '@contember/schema'
import { ObjectNode } from '../../inputProcessing/index.js'

export class OrderByHelper {
	public static appendDefaultOrderBy(
		entity: Model.Entity,
		objectNode: ObjectNode<Input.ListQueryInput>,
		defaultOrderBy: readonly Model.OrderBy[],
	): ObjectNode<Input.ListQueryInput> {
		const inputOrder = objectNode.args.orderBy || []
		const hasOrderBy = inputOrder.length > 0
		if (!hasOrderBy && defaultOrderBy.length > 0) {
			const defaultOrderByWithPrimary = [...defaultOrderBy, ...this.getPrimaryOrderBy(inputOrder, entity)]
			return objectNode.withArg('orderBy', this.buildOrderBy(defaultOrderByWithPrimary))
		}
		const hasLimit = typeof objectNode.args.limit === 'number'
		const hasOffset = typeof objectNode.args.offset === 'number'
		if (
			(!hasLimit && !hasOffset && !hasOrderBy) ||
			(hasOrderBy && (inputOrder[0]._random || inputOrder[0]._randomSeeded !== undefined))
		) {
			return objectNode
		}

		const orderBy = this.buildOrderBy(this.getPrimaryOrderBy(inputOrder, entity))
		return objectNode.withArg('orderBy', [...(inputOrder || []), ...orderBy])
	}

	private static buildOrderBy(defaultOrderBy: readonly Model.OrderBy[]): Input.OrderByFields[] {
		return defaultOrderBy
			.map(({ path, direction }): Input.OrderByFields | null => {
				const mutablePath = [...path]
				const lastItem = mutablePath.pop()
				if (!lastItem) {
					return null
				}
				const columnOrderBy = { [lastItem]: direction }
				return mutablePath.reverse().reduce<Input.OrderByFields>((value, field) => ({ [field]: value }), columnOrderBy)
			})
			.filter((it): it is Input.OrderByFields => !!it)
	}

	private static getPrimaryOrderBy(inputOrder: Input.OrderBy[], entity: Model.Entity): Model.OrderBy[] {
		return inputOrder.find(it => !!it[entity.primary])
			? []
			: [{ path: [entity.primary], direction: Model.OrderDirection.asc }]
	}
}
