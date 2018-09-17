import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
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

export default class MarkerTreeRoot {
	private constructor(
		public readonly id: TreeId,
		public readonly root: EntityMarker,
		public readonly constraints: MarkerTreeConstraints
	) {}

	private static getNewTreeId: () => TreeId = (() => {
		let id = 0

		return () => (id++).toFixed(0)
	})()

	public static createInstance(rootMarker: MarkerTreeRoot['root'], constraints: MarkerTreeRoot['constraints']): MarkerTreeRoot {
		return new MarkerTreeRoot(MarkerTreeRoot.getNewTreeId(), rootMarker, constraints)
	}
}
