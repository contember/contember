import { DataViewFilterArtifact } from '../types'
import { useDataViewFilteringMethods, useDataViewFilteringState } from '../contexts'
import { SetStateAction, useCallback } from 'react'

export const useDataViewFilter = <T extends DataViewFilterArtifact>(key: string): [T | undefined, (filter: SetStateAction<T | undefined>) => void] => {
	const state = useDataViewFilteringState().artifact[key] as T | undefined
	const { setFilter } = useDataViewFilteringMethods()

	return [
		state,
		useCallback((filter: SetStateAction<T | undefined>) => {
			setFilter(key, filter)
		}, [key, setFilter]),
	]
}
