import { CrudQueryBuilder, GraphQlBuilder } from 'cms-client'
import { Input } from '@contember/schema'
import { EntityName, FieldName, Filter } from '../bindingTypes'
import { QueryLanguage } from '../queryLanguage'
import { Environment } from './Environment'
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

export interface SugaredSingleEntityTreeConstraints extends Omit<SingleEntityTreeConstraints, 'where'> {
	where: string | Input.UniqueWhere<GraphQlBuilder.Literal>
}

export interface SugaredEntityListTreeConstraints extends Omit<EntityListTreeConstraints, 'filter'> {
	filter?: string | Filter
}

export type SugaredMarkerTreeConstraints =
	| SugaredSingleEntityTreeConstraints
	| SugaredEntityListTreeConstraints
	| undefined

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

	public static createFromSugaredEntityListConstraints(
		environment: Environment,
		entityName: EntityName,
		fields: EntityFields,
		constraints: SugaredEntityListTreeConstraints,
		associatedField?: FieldName,
	): MarkerTreeRoot<EntityListTreeConstraints> {
		return new MarkerTreeRoot<EntityListTreeConstraints>(
			entityName,
			fields,
			{
				...constraints,
				filter:
					typeof constraints.filter === 'string'
						? QueryLanguage.parseFilter(constraints.filter, environment)
						: constraints.filter,
			},
			associatedField,
		)
	}

	public static createFromSugaredSingleEntityConstraints(
		environment: Environment,
		entityName: EntityName,
		fields: EntityFields,
		constraints: SugaredSingleEntityTreeConstraints,
		associatedField?: FieldName,
	): MarkerTreeRoot<SingleEntityTreeConstraints> {
		return new MarkerTreeRoot<SingleEntityTreeConstraints>(
			entityName,
			fields,
			{
				...constraints,
				where:
					typeof constraints.where === 'string'
						? QueryLanguage.parseUniqueWhere(constraints.where, environment)
						: constraints.where,
			},
			associatedField,
		)
	}

	public get placeholderName(): string {
		return PlaceholderGenerator.generateMarkerTreeRootPlaceholder(this)
	}
}

namespace MarkerTreeRoot {
	export type TreeId = string
}

export { MarkerTreeRoot }
