import { SubTreeMarker } from './SubTreeMarker'

export class MarkerTreeRoot {
	public constructor(public readonly subTrees: Map<string, SubTreeMarker>) {}
}
