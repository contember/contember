import { SuccessfulPersistResult } from '../coreComponents'
import { MarkerTreeRoot } from './MarkerTreeRoot'

export class MetaOperationsAccessor {
	public constructor(
		public readonly treeId: MarkerTreeRoot.TreeId,

		// In the event of error, the reject value will be ErrorPersistResult
		public readonly triggerPersist: () => Promise<SuccessfulPersistResult>,
	) {}
}
