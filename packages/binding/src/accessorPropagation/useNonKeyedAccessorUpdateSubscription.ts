import * as React from 'react'
import { EntityAccessor, EntityListAccessor, FieldAccessor } from '../accessors'

/**
 * It is VERY IMPORTANT for the parameter to be referentially stable!
 */
function useNonKeyedAccessorUpdateSubscription(getFieldAccessor: () => FieldAccessor): FieldAccessor
function useNonKeyedAccessorUpdateSubscription(getEntityListAccessor: () => EntityListAccessor): EntityListAccessor
function useNonKeyedAccessorUpdateSubscription<A extends FieldAccessor | EntityListAccessor>(getAccessor: () => A): A {
	// This is *HEAVILY* adopted from https://github.com/facebook/react/blob/master/packages/use-subscription/src/useSubscription.js
	const [state, setState] = React.useState<{
		accessor: A
		getAccessor: () => A
	}>(() => ({
		accessor: getAccessor(),
		getAccessor,
	}))

	let accessor = state.accessor

	if (state.getAccessor !== getAccessor) {
		setState({
			accessor: getAccessor(),
			getAccessor,
		})
	}

	const addEventListener = accessor.addEventListener
	React.useEffect(() => {
		let isStillSubscribed = true

		const unsubscribe = addEventListener('update', (newAccessor: FieldAccessor | EntityListAccessor) => {
			if (!isStillSubscribed) {
				return
			}

			setState(prevState => {
				if (prevState.getAccessor !== getAccessor || prevState.accessor === newAccessor) {
					return prevState
				}

				return {
					accessor: newAccessor as A,
					getAccessor,
				}
			})
		})

		return () => {
			isStillSubscribed = false
			unsubscribe()
		}
	}, [addEventListener, getAccessor])

	return accessor
}
export { useNonKeyedAccessorUpdateSubscription }
