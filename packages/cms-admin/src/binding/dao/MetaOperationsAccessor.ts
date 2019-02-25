import { MarkerTreeRoot } from './MarkerTreeRoot'

export class MetaOperationsAccessor {
	public constructor(
		public readonly treeid: MarkerTreeRoot.TreeId,
		public readonly triggerPersist: () => Promise<void>
	) {}
}
