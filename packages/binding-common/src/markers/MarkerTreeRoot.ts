import type { Alias, PlaceholderName } from '../treeParameters/index.js'
import type { SubTreeMarkers } from './SubTreeMarkers.js'

export class MarkerTreeRoot {
	public constructor(
		public readonly subTrees: SubTreeMarkers,
		public readonly placeholdersByAliases: ReadonlyMap<Alias, PlaceholderName>,
	) {}
}
