import { MarkerSubTree } from './MarkerSubTree'

export class MarkerTreeRoot {
	public constructor(public readonly subTrees: Map<string, MarkerSubTree>) {}
}
