import { useConstantValueInvariant } from '@contember/react-utils'
import { useCallback, useEffect, useState } from 'react'
import { EntityAccessor, EntityListAccessor, FieldAccessor } from '../accessors'
import { FieldValue } from '../treeParameters'

export type ForceAccessorUpdate = () => void

/**
 * It is VERY IMPORTANT for the parameter to be referentially stable!
 */
function useAccessorUpdateSubscription<Value extends FieldValue = FieldValue>(
	getFieldAccessor: () => FieldAccessor<Value>,
): FieldAccessor<Value>
function useAccessorUpdateSubscription(getEntityAccessor: () => EntityAccessor): EntityAccessor
function useAccessorUpdateSubscription(getListAccessor: () => EntityListAccessor): EntityListAccessor
function useAccessorUpdateSubscription(
	getAccessor: () => EntityListAccessor | EntityAccessor,
): EntityListAccessor | EntityAccessor
function useAccessorUpdateSubscription<Value extends FieldValue = FieldValue>(
	getFieldAccessor: () => FieldAccessor<Value>,
	withForceUpdate: true,
): [FieldAccessor<Value>, ForceAccessorUpdate]
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
	A extends FieldAccessor<Value> | EntityListAccessor | EntityAccessor,
	Value extends FieldValue = FieldValue
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

	useEffect(() => {
		let isStillSubscribed = true

		const unsubscribe = (getAccessor().addEventListener as (
			eventType: 'update',
			handler: (newAccessor: FieldAccessor<Value> | EntityListAccessor | EntityAccessor) => void,
		) => () => void)('update', newAccessor => {
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
	}, [getAccessor])

	if (withForceUpdate && forceUpdate) {
		return [accessor, forceUpdate]
	}
	return accessor
}
export { useAccessorUpdateSubscription }
