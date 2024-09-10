import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * It is VERY IMPORTANT for the parameter to be referentially stable!
 */
export const useAccessorUpdateSubscription = <Accessor extends {
	addEventListener: (event: { type: 'update' }, cb: (accessor: Accessor) => void) => () => void
}>(getAccessor: () => Accessor): [Accessor, {update: () => void}] => {
	const [state, setState] = useState<Accessor>(() => getAccessor())
	const getterRef = useRef(getAccessor)

	let accessor = state
	if (getterRef.current !== getAccessor) {
		accessor = getAccessor()
		setState(accessor)
		getterRef.current = getAccessor
	}

	useEffect(() => {
		let isStillSubscribed = true
		const unsubscribe = getAccessor().addEventListener({ type: 'update' }, newAccessor => {
			if (!isStillSubscribed || getterRef.current !== getAccessor) {
				return
			}
			setState(newAccessor)
		})

		return () => {
			isStillSubscribed = false
			unsubscribe()
		}
	}, [getAccessor])

	const update = useCallback(() => {
		setState(getAccessor())
	}, [getAccessor])

	return [accessor, { update }]
}
