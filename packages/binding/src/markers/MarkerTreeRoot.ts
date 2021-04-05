import { Alias, PlaceholderName } from '../treeParameters'
import { SubTreeMarkers } from './SubTreeMarkers'

export class MarkerTreeRoot {
	public constructor(
		public readonly subTrees: SubTreeMarkers,
		public readonly placeholdersByAliases: Map<Alias, PlaceholderName>,
	) {}
}
