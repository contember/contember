import { useEffect, useState } from 'react'
import { useCurrentRequest } from '../contexts'
import { useRedirect } from './useRedirect'
import { StateStorageOrName, useStoredState } from '@contember/react-utils'


const emptyDim = [] as string[]

export const useDimensionState = ({ dimension, defaultValue, storage = 'null' }: {
	dimension: string
	defaultValue: string | string[]
	storage?: StateStorageOrName
}) => {
	const currentDimensionValue = useCurrentRequest()?.dimensions[dimension] ?? emptyDim

	const [storedState, setStoredState] = useStoredState<string[]>(storage, ['', `dimension.${dimension}`], it => {
		const valuesArray = Array.isArray(defaultValue) ? defaultValue : [defaultValue]
		return it ?? valuesArray
	})
	const [initialStoredState] = useState(storedState)
	const redirect = useRedirect()

	useEffect(() => {
		if (currentDimensionValue.length > 0 && !(currentDimensionValue.length === 1 && currentDimensionValue[0] === '')) {
			setStoredState(currentDimensionValue)
		}
	}, [currentDimensionValue, setStoredState])

	useEffect(() => {
		const isDimensionEmpty = currentDimensionValue.length === 0 || (currentDimensionValue.length === 1 && currentDimensionValue[0] === '')

		if (isDimensionEmpty && initialStoredState.length > 0 && initialStoredState[0] !== '') {
			redirect(it => it ? {
				...it,
				dimensions: {
					...it.dimensions,
					[dimension]: initialStoredState,
				},
			} : null)
		}
	}, [currentDimensionValue, dimension, initialStoredState, redirect])

	return currentDimensionValue
}
