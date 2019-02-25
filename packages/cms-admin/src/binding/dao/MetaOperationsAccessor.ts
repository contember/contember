import { MarkerTreeRoot } from './MarkerTreeRoot'

export class MetaOperationsAccessor {
	public constructor(
		public readonly treeId: MarkerTreeRoot.TreeId,
		public readonly triggerPersist: () => Promise<void>
	) {}
}
