import * as React from 'react'
import { EntityAccessor } from '../accessors'

/**
 * @param getEntityAccessor It is VERY IMPORTANT for the parameter to be referentially stable!
 */
export const useEntityAccessorUpdateSubscription = (getEntityAccessor: () => EntityAccessor) => {
	// This is *HEAVILY* adopted from https://github.com/facebook/react/blob/master/packages/use-subscription/src/useSubscription.js
	const [state, setState] = React.useState<{
		accessorKey: string
		accessor: EntityAccessor
		getEntityAccessor: () => EntityAccessor
	}>(() => {
		const accessor = getEntityAccessor()
		return {
			accessor,
			accessorKey: accessor.key,
			getEntityAccessor,
		}
	})

	let accessor = state.accessor

	if (state.accessorKey !== accessor.key || state.getEntityAccessor !== getEntityAccessor) {
		const accessor = getEntityAccessor()
		setState({
			accessor,
			accessorKey: accessor.key,
			getEntityAccessor,
		})
	}

	const addEventListener = accessor.addEventListener
	React.useEffect(() => {
		let isStillSubscribed = true

		const unsubscribe = addEventListener('update', newAccessor => {
			if (!isStillSubscribed) {
				return
			}

			setState(prevState => {
				if (prevState.accessorKey !== newAccessor.key || prevState.getEntityAccessor !== getEntityAccessor) {
					return prevState
				}

				if (prevState.accessor === newAccessor) {
					return prevState
				}

				return {
					accessor: newAccessor,
					accessorKey: newAccessor.key,
					getEntityAccessor,
				}
			})
		})

		return () => {
			isStillSubscribed = false
			unsubscribe()
		}
	}, [addEventListener, getEntityAccessor])

	return accessor
}
