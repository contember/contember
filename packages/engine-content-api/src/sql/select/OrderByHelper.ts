import { Input } from '@contember/schema'
import Model from '@contember/schema/dist/src/schema/model'
import { ObjectNode } from '../../inputProcessing'

export class OrderByHelper {
	public static appendDefaultOrderBy(
		entity: Model.Entity,
		objectNode: ObjectNode<Input.ListQueryInput>,
		defaultOrderBy: Model.OrderBy[],
	): ObjectNode<Input.ListQueryInput> {
		const inputOrder = objectNode.args.orderBy || []
		const hasOrderBy = inputOrder.length > 0
		if (!hasOrderBy && defaultOrderBy.length > 0) {
			const defaultOrderByWithPrimary = [...defaultOrderBy, ...this.getPrimaryOrderBy(inputOrder, entity)]
			return objectNode.withArg('orderBy', this.buildOrderBy(defaultOrderByWithPrimary))
		}
		const hasLimit = typeof objectNode.args.limit === 'number'
		const hasOffset = typeof objectNode.args.offset === 'number'
		if (!hasLimit && !hasOffset && !hasOrderBy) {
			return objectNode
		}

		const orderBy = this.buildOrderBy(this.getPrimaryOrderBy(inputOrder, entity))
		return objectNode.withArg('orderBy', [...(inputOrder || []), ...orderBy])
	}

	private static buildOrderBy(defaultOrderBy: Model.OrderBy[]): Input.OrderBy[] {
		return defaultOrderBy
			.map(({ path, direction }) => {
				path = [...path]
				const lastItem = path.pop()
				if (!lastItem) {
					return null
				}
				const columnOrderBy = { [lastItem]: direction }
				return path.reverse().reduce<Input.OrderBy>((value, field) => ({ [field]: value }), columnOrderBy)
			})
			.filter((it): it is Input.OrderBy => !!it)
	}

	private static getPrimaryOrderBy(inputOrder: Input.OrderBy[], entity: Model.Entity): Model.OrderBy[] {
		return inputOrder.find(it => !!it[entity.primary])
			? []
			: [{ path: [entity.primary], direction: Model.OrderDirection.asc }]
	}
}
