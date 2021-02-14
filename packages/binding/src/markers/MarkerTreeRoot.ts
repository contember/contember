import { Alias, PlaceholderName, TreeRootId } from '../treeParameters'
import { generateEnumerabilityPreventingEntropy } from '../utils'
import { EntityListSubTreeMarker } from './EntityListSubTreeMarker'
import { EntitySubTreeMarker } from './EntitySubTreeMarker'

export class MarkerTreeRoot {
	private static getNextSeed = (() => {
		let seed = 0
		return () => seed++
	})()

	public readonly treeId: TreeRootId

	public constructor(
		public readonly subTrees: Map<PlaceholderName, EntitySubTreeMarker | EntityListSubTreeMarker>,
		public readonly placeholdersByAliases: Map<Alias, PlaceholderName>,
	) {
		const enumerabilityPreventingEntropy = generateEnumerabilityPreventingEntropy()
		this.treeId = `treeRoot-${enumerabilityPreventingEntropy}-${MarkerTreeRoot.getNextSeed()}`
	}
}
