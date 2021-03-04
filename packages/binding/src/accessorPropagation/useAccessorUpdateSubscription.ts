import { useConstantValueInvariant } from '@contember/react-utils'
import { useState, useCallback, useEffect } from 'react'
import { EntityAccessor, EntityListAccessor, FieldAccessor } from '../accessors'
import { FieldValue } from '../treeParameters'

export type ForceAccessorUpdate = () => void

/**
 * It is VERY IMPORTANT for the parameter to be referentially stable!
 */
function useAccessorUpdateSubscription<
	Persisted extends FieldValue = FieldValue,
	Produced extends Persisted = Persisted
>(getFieldAccessor: () => FieldAccessor<Persisted, Produced>): FieldAccessor<Persisted, Produced>
function useAccessorUpdateSubscription(getEntityAccessor: () => EntityAccessor): EntityAccessor
function useAccessorUpdateSubscription(getListAccessor: () => EntityListAccessor): EntityListAccessor
function useAccessorUpdateSubscription(
	getAccessor: () => EntityListAccessor | EntityAccessor,
): EntityListAccessor | EntityAccessor
function useAccessorUpdateSubscription<
	Persisted extends FieldValue = FieldValue,
	Produced extends Persisted = Persisted
>(
	getFieldAccessor: () => FieldAccessor<Persisted, Produced>,
	withForceUpdate: true,
): [FieldAccessor<Persisted, Produced>, ForceAccessorUpdate]
function useAccessorUpdateSubscription(
	getEntityAccessor: () => EntityAccessor,
	withForceUpdate: true,
): [EntityAccessor, ForceAccessorUpdate]
function useAccessorUpdateSubscription(
	getListAccessor: () => EntityListAccessor,
	withForceUpdate: true,
): [EntityListAccessor, ForceAccessorUpdate]
function useAccessorUpdateSubscription(
	getAccessor: () => EntityListAccessor | EntityAccessor,
	withForceUpdate: true,
): [EntityListAccessor | EntityAccessor, ForceAccessorUpdate]
function useAccessorUpdateSubscription<
	A extends FieldAccessor<Persisted, Produced> | EntityListAccessor | EntityAccessor,
	Persisted extends FieldValue = FieldValue,
	Produced extends Persisted = Persisted
>(getAccessor: () => A, withForceUpdate?: true): A | [A, ForceAccessorUpdate] {
	// This is *HEAVILY* adopted from https://github.com/facebook/react/blob/master/packages/use-subscription/src/useSubscription.js
	const [state, setState] = useState<{
		accessor: A
		getAccessor: () => A
	}>(() => ({
		accessor: getAccessor(),
		getAccessor,
	}))

	useConstantValueInvariant(withForceUpdate, 'useAccessorUpdateSubscription: cannot change the withForceUpdate value!')

	let accessor = state.accessor

	if (state.getAccessor !== getAccessor) {
		setState({
			accessor: getAccessor(),
			getAccessor,
		})
	}

	let forceUpdate: ForceAccessorUpdate | undefined = undefined
	if (withForceUpdate) {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		forceUpdate = useCallback(() => {
			setState({
				accessor: getAccessor(),
				getAccessor,
			})
		}, [getAccessor])
	}

	const addEventListener: (
		eventType: 'update',
		handler: (newAccessor: FieldAccessor<Persisted, Produced> | EntityListAccessor | EntityAccessor) => void,
	) => () => void = accessor.addEventListener
	useEffect(() => {
		let isStillSubscribed = true

		const unsubscribe = addEventListener('update', newAccessor => {
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

	if (withForceUpdate && forceUpdate) {
		return [accessor, forceUpdate]
	}
	return accessor
}
export { useAccessorUpdateSubscription }
