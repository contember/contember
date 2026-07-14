import { Input, Model } from '@contember/schema'
import { ObjectNode } from '../../inputProcessing/index.js'

export class OrderByHelper {
	public static appendDefaultOrderBy(
		entity: Model.Entity,
		objectNode: ObjectNode<Input.ListQueryInput>,
		relationOrderBy: readonly Model.OrderBy[] | undefined,
	): ObjectNode<Input.ListQueryInput> {
		const originalInputOrder = objectNode.args.orderBy || []
		const inputOrder = originalInputOrder.filter(orderBy => !this.isNullRandomOrder(orderBy))
		const normalizedObjectNode = inputOrder.length === originalInputOrder.length
			? objectNode
			: objectNode.withArg('orderBy', inputOrder)
		const hasOrderBy = inputOrder.length > 0
		const defaultOrderBy = relationOrderBy ?? entity.orderBy ?? []
		if (!hasOrderBy && defaultOrderBy.length > 0) {
			const defaultOrderByWithPrimary = [...defaultOrderBy, ...this.getPrimaryOrderBy(inputOrder, entity)]
			return normalizedObjectNode.withArg('orderBy', this.buildOrderBy(defaultOrderByWithPrimary))
		}
		const hasLimit = typeof objectNode.args.limit === 'number'
		const hasOffset = typeof objectNode.args.offset === 'number'
		if (
			(!hasLimit && !hasOffset && !hasOrderBy)
			|| (hasOrderBy && (inputOrder[0]._random === true || typeof inputOrder[0]._randomSeeded === 'number'))
		) {
			return normalizedObjectNode
		}

		const orderBy = this.buildOrderBy(this.getPrimaryOrderBy(inputOrder, entity))
		return normalizedObjectNode.withArg('orderBy', [...inputOrder, ...orderBy])
	}

	private static isNullRandomOrder(orderBy: Input.OrderBy): boolean {
		const entries = Object.entries(orderBy)
		return entries.length === 1
			&& (entries[0][0] === '_random' || entries[0][0] === '_randomSeeded')
			&& entries[0][1] === null
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
