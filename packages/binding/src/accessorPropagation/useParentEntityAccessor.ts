import * as React from 'react'
import { EntityAccessor, GetEntityByKey } from '../accessors'
import { BindingError } from '../BindingError'
import { useEntityKey } from './useEntityKey'
import { useGetEntityByKey } from './useGetEntityByKey'

// This is *HEAVILY* adopted from https://github.com/facebook/react/blob/master/packages/use-subscription/src/useSubscription.js
export const useParentEntityAccessor = (): EntityAccessor => {
	const entityKey = useEntityKey()
	const getEntityByKey = useGetEntityByKey()

	if (entityKey === undefined) {
		throw new BindingError(
			`Trying to use a data bound component outside a correct parent. Perhaps you forgot to use a data provider?`,
		)
	}

	const [state, setState] = React.useState<{
		entityKey: string
		accessor: EntityAccessor
		getEntityByKey: GetEntityByKey
	}>(() => {
		const accessor = getEntityByKey(entityKey)

		if (!(accessor instanceof EntityAccessor)) {
			throw new BindingError(`Corrupted data: trying to render a non-existent entity.`)
		}
		return {
			accessor,
			entityKey,
			getEntityByKey,
		}
	})

	let accessor = state.accessor

	if (state.entityKey !== entityKey || state.getEntityByKey !== getEntityByKey) {
		const newAccessor = getEntityByKey(entityKey)

		if (!(newAccessor instanceof EntityAccessor)) {
			throw new BindingError('FFF')
		}

		accessor = newAccessor
		setState({
			accessor,
			entityKey,
			getEntityByKey,
		})
	}

	const addEventListener = accessor.addEventListener
	React.useEffect(() => {
		let isMounted = true

		const unsubscribe = addEventListener('update', accessor => {
			if (!isMounted || !(accessor instanceof EntityAccessor)) {
				return
			}

			setState(prevState => {
				if (prevState.entityKey !== entityKey || prevState.getEntityByKey !== getEntityByKey) {
					return prevState
				}

				if (prevState.accessor === accessor) {
					return prevState
				}

				return {
					accessor,
					entityKey,
					getEntityByKey,
				}
			})
		})

		return () => {
			isMounted = false
			unsubscribe()
		}
	}, [addEventListener, entityKey, getEntityByKey])

	return accessor
}
