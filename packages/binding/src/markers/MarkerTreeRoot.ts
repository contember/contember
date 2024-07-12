import type { Alias, PlaceholderName } from '../treeParameters'
import type { SubTreeMarkers } from './SubTreeMarkers'

export class MarkerTreeRoot {
	public constructor(
		public readonly subTrees: SubTreeMarkers,
		public readonly placeholdersByAliases: Map<Alias, PlaceholderName>,
	) {}
}
