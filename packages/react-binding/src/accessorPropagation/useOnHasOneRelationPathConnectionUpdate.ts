import type { EntityAccessor, HasOneRelation } from '@contember/binding'
import { useObjectMemo } from '@contember/react-utils'
import { useEffect } from 'react'
import { useEntityKey } from './useEntityKey.js'
import { useGetEntityByKey } from './useGetEntityByKey.js'

/**
 * Calls `update` when any has-one relation along the path is reconnected, not only the first one.
 * Each hop is watched on the entity it currently hangs off, so the listeners move once an earlier hop is reconnected.
 */
export const useOnHasOneRelationPathConnectionUpdate = (hasOneRelationPath: HasOneRelation[], update: () => void): void => {
	const entityKey = useEntityKey()
	const getEntityByKey = useGetEntityByKey()

	// A getter is stable per entity realm, so this array changes exactly when a hop resolves to another entity.
	const hopParentGetters: EntityAccessor.GetEntityAccessor[] = []
	if (hasOneRelationPath.length > 0) {
		let hopParent = getEntityByKey(entityKey)
		for (const [index, hop] of hasOneRelationPath.entries()) {
			hopParentGetters.push(hopParent.getAccessor)
			if (index < hasOneRelationPath.length - 1) {
				hopParent = hopParent.getEntity({ hasOneRelationPath: [hop] })
			}
		}
	}
	const stableHopParentGetters = useObjectMemo(hopParentGetters)

	useEffect(() => {
		const unsubscribers = stableHopParentGetters.map((getHopParent, index) =>
			getHopParent().addEventListener({ type: 'connectionUpdate', key: hasOneRelationPath[index].field }, update)
		)
		return () => {
			for (const unsubscribe of unsubscribers) {
				unsubscribe()
			}
		}
	}, [hasOneRelationPath, stableHopParentGetters, update])
}
