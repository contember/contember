import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import { EntityName, FieldName } from '../bindingTypes'
import PlaceholderGenerator from '../model/PlaceholderGenerator'
import EntityFields from './EntityFields'

export interface SingleEntityTreeConstraints {
	where: Input.UniqueWhere<GraphQlBuilder.Literal>
	whereType: 'unique'
}

export interface EntityListTreeConstraints {
	where?: Input.Where<GraphQlBuilder.Literal>
	whereType: 'nonUnique'
}

export type MarkerTreeConstraints = SingleEntityTreeConstraints | EntityListTreeConstraints

class MarkerTreeRoot<C extends MarkerTreeConstraints = MarkerTreeConstraints> {
	private static getNewTreeId: () => MarkerTreeRoot.TreeId = (() => {
		let id = 0

		return () => `treeRoot${(id++).toFixed(0)}`
	})()

	private constructor(
		public readonly id: MarkerTreeRoot.TreeId,
		public readonly entityName: EntityName,
		public readonly fields: EntityFields,
		public readonly constraints: C,
		public readonly associatedField?: FieldName,
	) {}

	public get placeholderName(): string {
		return PlaceholderGenerator.generateMarkerTreeRootPlaceholder(this)
	}

	public static createInstance(
		entityName: EntityName,
		fields: MarkerTreeRoot['fields'],
		constraints: MarkerTreeRoot['constraints'],
		associatedField?: FieldName,
	): MarkerTreeRoot {
		return new MarkerTreeRoot(MarkerTreeRoot.getNewTreeId(), entityName, fields, constraints, associatedField)
	}
}

namespace MarkerTreeRoot {
	export type TreeId = string
}

export default MarkerTreeRoot
