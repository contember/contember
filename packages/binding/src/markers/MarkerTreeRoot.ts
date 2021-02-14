import { Alias, PlaceholderName } from '../treeParameters'
import { EntityListSubTreeMarker } from './EntityListSubTreeMarker'
import { EntitySubTreeMarker } from './EntitySubTreeMarker'

export class MarkerTreeRoot {
	public constructor(
		public readonly subTrees: Map<PlaceholderName, EntitySubTreeMarker | EntityListSubTreeMarker>,
		public readonly placeholdersByAliases: Map<Alias, PlaceholderName>,
	) {}
}
