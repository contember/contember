import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * It is VERY IMPORTANT for the parameter to be referentially stable!
 */
export const useAccessorUpdateSubscription = <
	Accessor extends {
		addEventListener: (event: { type: 'update' }, cb: (accessor: Accessor) => void) => () => void
		getAccessor: () => Accessor
	},
>(getAccessor: () => Accessor): [Accessor, { update: () => void }] => {
	const [state, setState] = useState<Accessor>(() => getAccessor())
	const getterRef = useRef(getAccessor)

	let accessor = state
	if (getterRef.current !== getAccessor) {
		accessor = getAccessor()
		setState(accessor)
		getterRef.current = getAccessor
	}

	// A state node's getter is stable, so this changes exactly when `getAccessor` resolves to another node.
	const getSubscribedAccessor = accessor.getAccessor

	useEffect(() => {
		let isStillSubscribed = true
		const unsubscribe = getSubscribedAccessor().addEventListener({ type: 'update' }, newAccessor => {
			if (!isStillSubscribed || getterRef.current !== getAccessor) {
				return
			}
			setState(newAccessor)
		})
		// Catches up with updates that landed between the render and this subscription.
		setState(getAccessor())

		return () => {
			isStillSubscribed = false
			unsubscribe()
		}
	}, [getAccessor, getSubscribedAccessor])

	const update = useCallback(() => {
		setState(getAccessor())
	}, [getAccessor])

	return [accessor, { update }]
}
