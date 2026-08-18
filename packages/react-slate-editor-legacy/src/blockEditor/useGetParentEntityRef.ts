import { EntityAccessor, useEntityKey, useGetEntityByKey } from '@contember/react-binding'
import { useEffect, useRef, useState } from 'react'

/**
 * The editor reaches for its entity from slate callbacks, which run outside of a render. Holding its key breaks
 * there: a persist that creates the entity gives it a new realm key, and the key this hook is holding stops
 * resolving until the next render updates it. Its `getAccessor` survives the change — it closes over the realm
 * itself, which is only ever mutated in place.
 */
export const useGetParentEntityRef = () => {
	const key = useEntityKey()
	const getEntity = useGetEntityByKey()
	const [initialGetter] = useState(() => getEntity(key).getAccessor)
	const ref = useRef<() => EntityAccessor>(initialGetter)
	useEffect(() => {
		ref.current = getEntity(key).getAccessor
	}, [getEntity, key])
	return ref
}
