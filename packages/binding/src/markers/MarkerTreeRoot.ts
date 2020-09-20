import { Alias } from '../treeParameters'
import { SubTreeMarker } from './SubTreeMarker'

export class MarkerTreeRoot {
	public constructor(
		public readonly subTrees: Map<string, SubTreeMarker>,
		public readonly placeholdersByAliases: Map<Alias, string>,
	) {}
}
