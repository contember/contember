import { assertNever } from '../../utils'
import { InternalEntityListState } from './InternalEntityListState'
import { InternalEntityState } from './InternalEntityState'
import { InternalStateType } from './InternalStateType'

export class InternalStateIterator {
	public static *depthFirstINodes(
		store: Map<string, InternalEntityState>,
		root: InternalEntityState | InternalEntityListState,
		match: (iNode: InternalEntityState | InternalEntityListState) => boolean,
	): Generator<InternalEntityState | InternalEntityListState, void> {
		if (root.type === InternalStateType.SingleEntity) {
			for (const [, childState] of root.fields) {
				if (childState.type === InternalStateType.SingleEntity || childState.type === InternalStateType.EntityList) {
					yield* this.depthFirstINodes(store, childState, match)
				}
			}
		} else if (root.type === InternalStateType.EntityList) {
			for (const childKey of root.childrenKeys) {
				const child = store.get(childKey)
				if (child === undefined) {
					continue
				}
				yield* this.depthFirstINodes(store, child, match)
			}
		} else {
			return assertNever(root)
		}
		if (match(root)) {
			yield root
		}
	}
}
