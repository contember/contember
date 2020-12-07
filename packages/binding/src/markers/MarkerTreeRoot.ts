import { Alias, PlaceholderName } from '../treeParameters'
import { SubTreeMarker } from './SubTreeMarker'

export class MarkerTreeRoot {
	public constructor(
		public readonly subTrees: Map<PlaceholderName, SubTreeMarker>,
		public readonly placeholdersByAliases: Map<Alias, PlaceholderName>,
	) {}
}
