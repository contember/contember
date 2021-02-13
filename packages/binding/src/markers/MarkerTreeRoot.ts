import { Alias, PlaceholderName } from '../treeParameters'
import { EntityListSubTreeMarker } from './EntityListSubTreeMarker'
import { EntitySubTreeMarker } from './EntitySubTreeMarker'

export type MarkerTreeRootId = string

export class MarkerTreeRoot {
	private static getNextSeed = (() => {
		let seed = 0
		return () => seed++
	})()

	public readonly treeId: MarkerTreeRootId

	public constructor(
		public readonly subTrees: Map<PlaceholderName, EntitySubTreeMarker | EntityListSubTreeMarker>,
		public readonly placeholdersByAliases: Map<Alias, PlaceholderName>,
	) {
		const enumerabilityPreventingEntropy = (Math.random() * 1e5).toFixed(0)
		this.treeId = `tree-${enumerabilityPreventingEntropy}-${MarkerTreeRoot.getNextSeed()}`
	}
}
