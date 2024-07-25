import { DataViewFilterArtifact } from '../types'
import { useDataViewFilteringMethods, useDataViewFilteringState } from '../contexts'
import { SetStateAction, useCallback } from 'react'

type UseDataViewFilterResult<T extends DataViewFilterArtifact> = [
	state: T | undefined,
	action: (filter: SetStateAction<T | undefined>) => void,
	meta: {
		isEmpty?: boolean
	},
]
export const useDataViewFilter = <T extends DataViewFilterArtifact>(key: string): UseDataViewFilterResult<T> => {
	const filteringState = useDataViewFilteringState()
	const state = filteringState.artifact[key] as T | undefined
	const isEmpty = state ? filteringState.filterTypes[key]?.isEmpty?.(state) : true
	const { setFilter } = useDataViewFilteringMethods()

	return [
		state,
		useCallback((filter: SetStateAction<T | undefined>) => {
			setFilter(key, filter)
		}, [key, setFilter]),
		{ isEmpty },
	]
}
