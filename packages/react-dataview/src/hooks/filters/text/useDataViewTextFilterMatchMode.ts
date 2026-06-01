import { useCallback } from 'react'
import { TextFilterArtifacts, TextFilterArtifactsMatchMode } from '../../../filterTypes/index.js'
import { useDataViewFilter } from '../../useDataViewFilter.js'

export type UseDataViewTextFilterMatchModeResult = [isCurrent: boolean, set: () => void]

export const useDataViewTextFilterMatchMode = (name: string, mode: TextFilterArtifactsMatchMode): UseDataViewTextFilterMatchModeResult => {
	const [state, setFilter] = useDataViewFilter<TextFilterArtifacts>(name)

	const cb = useCallback(() => {
		setFilter(it => ({
			...it,
			mode,
		}))
	}, [setFilter, mode])

	return [state?.mode === mode, cb]
}
