import { Input, Model } from '@contember/schema'
import { ObjectNode } from '../../inputProcessing'

export class OrderByHelper {
	public static appendDefaultOrderBy(
		entity: Model.Entity,
		objectNode: ObjectNode<Input.ListQueryInput>,
		relationOrderBy: readonly Model.OrderBy[] | undefined,
	): ObjectNode<Input.ListQueryInput> {
		const requestedOrder = objectNode.args.orderBy || []
		const inputOrder = requestedOrder.filter(it => !this.isEmptyRandomOrder(it))
		const inputNode = inputOrder.length === requestedOrder.length ? objectNode : objectNode.withArg('orderBy', inputOrder)
		const hasOrderBy = inputOrder.length > 0
		const defaultOrderBy = relationOrderBy ?? entity.orderBy ?? []
		if (!hasOrderBy && defaultOrderBy.length > 0) {
			const defaultOrderByWithPrimary = [...defaultOrderBy, ...this.getPrimaryOrderBy(inputOrder, entity)]
			return inputNode.withArg('orderBy', this.buildOrderBy(defaultOrderByWithPrimary))
		}
		const hasLimit = typeof inputNode.args.limit === 'number'
		const hasOffset = typeof inputNode.args.offset === 'number'
		if ((!hasLimit && !hasOffset && !hasOrderBy) || (hasOrderBy && this.isRandomOrder(inputOrder[0]))) {
			return inputNode
		}

		const orderBy = this.buildOrderBy(this.getPrimaryOrderBy(inputOrder, entity))
		return inputNode.withArg('orderBy', [...inputOrder, ...orderBy])
	}

	public static isRandomOrder(orderBy: Input.OrderBy): boolean {
		return orderBy._random === true || typeof orderBy._randomSeeded === 'number'
	}

	// GraphQL passes `{ _random: null }`, `{ _random: false }` and `{ _randomSeeded: null }` through; they order nothing.
	private static isEmptyRandomOrder(orderBy: Input.OrderBy): boolean {
		const keys = Object.keys(orderBy)
		return keys.length === 1 && (keys[0] === '_random' || keys[0] === '_randomSeeded') && !this.isRandomOrder(orderBy)
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
