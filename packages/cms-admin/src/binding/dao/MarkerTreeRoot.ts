import { CrudQueryBuilder, GraphQlBuilder } from 'cms-client'
import { Input } from '@contember/schema'
import { EntityName, FieldName, Filter } from '../bindingTypes'
import { PlaceholderGenerator } from './PlaceholderGenerator'
import { EntityFields } from './EntityFields'

export interface SingleEntityTreeConstraints {
	where: Input.UniqueWhere<GraphQlBuilder.Literal>
	whereType: 'unique'
}

export interface EntityListTreeConstraints {
	filter?: Filter
	orderBy?: Input.OrderBy<CrudQueryBuilder.OrderDirection>[]
	offset?: number
	limit?: number
	whereType: 'nonUnique'
}

export type MarkerTreeConstraints = SingleEntityTreeConstraints | EntityListTreeConstraints | undefined

class MarkerTreeRoot<C extends MarkerTreeConstraints = MarkerTreeConstraints> {
	private static getNewTreeId: () => MarkerTreeRoot.TreeId = (() => {
		let id = 0

		return () => `treeRoot${(id++).toFixed(0)}`
	})()

	public readonly id: MarkerTreeRoot.TreeId

	public constructor(
		public readonly entityName: EntityName,
		public readonly fields: EntityFields,
		public readonly constraints: C,
		public readonly associatedField?: FieldName,
	) {
		this.id = MarkerTreeRoot.getNewTreeId()
	}

	public get placeholderName(): string {
		return PlaceholderGenerator.generateMarkerTreeRootPlaceholder(this)
	}
}

namespace MarkerTreeRoot {
	export type TreeId = string
}

export { MarkerTreeRoot }
