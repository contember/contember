import { Input } from '@contember/schema'
import { CrudQueryBuilder, GraphQlBuilder } from 'cms-client'
import { EntityName, FieldName, Filter } from '../bindingTypes'
import { EntityFields } from './EntityFields'
import { PlaceholderGenerator } from './PlaceholderGenerator'

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
	public readonly id: MarkerTreeRoot.TreeId

	public constructor(
		idSeed: number,
		public readonly entityName: EntityName,
		public readonly fields: EntityFields,
		public readonly constraints: C,
		public readonly associatedField?: FieldName,
	) {
		this.id = `treeRoot${idSeed.toFixed(0)}`
	}

	public get placeholderName(): string {
		return PlaceholderGenerator.generateMarkerTreeRootPlaceholder(this)
	}
}

namespace MarkerTreeRoot {
	export type TreeId = string
}

export { MarkerTreeRoot }
