import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import { FieldName } from '../bindingTypes'
import EntityMarker from './EntityMarker'
import { TreeId } from './TreeId'

export interface SingleEntityTreeConstraints {
	where: Input.UniqueWhere<GraphQlBuilder.Literal>
	whereType: 'unique'
}

export interface EntityListTreeConstraints {
	where?: Input.Where<GraphQlBuilder.Literal>
	whereType: 'nonUnique'
}

export type MarkerTreeConstraints = SingleEntityTreeConstraints | EntityListTreeConstraints

export default class MarkerTreeRoot<C extends MarkerTreeConstraints = MarkerTreeConstraints> {
	private static getNewTreeId: () => TreeId = (() => {
		let id = 0

		return () => `treeRoot${(id++).toFixed(0)}`
	})()

	private constructor(
		public readonly id: TreeId,
		public readonly root: EntityMarker,
		public readonly constraints: C,
		public readonly associatedField?: FieldName
	) {}

	public get placeholderName(): string {
		return this.associatedField ? MarkerTreeRoot.getPlaceholderName(this.associatedField) : `__root_${this.id}`
	}

	public static getPlaceholderName(associatedField: FieldName): string {
		return `${associatedField}__data`
	}

	public static createInstance(
		rootMarker: MarkerTreeRoot['root'],
		constraints: MarkerTreeRoot['constraints'],
		associatedField?: FieldName
	): MarkerTreeRoot {
		return new MarkerTreeRoot(MarkerTreeRoot.getNewTreeId(), rootMarker, constraints, associatedField)
	}
}
