import { ChangeEvent, useCallback } from 'react'
import { useDataViewFilter } from '../../useDataViewFilter'
import { TextFilterArtifacts } from '../../../filterTypes'

export interface UseDataViewTextFilterInputResult {
	value: string
	onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

export const useDataViewTextFilterInput = (name: string): UseDataViewTextFilterInputResult => {
	const [state, setFilter] = useDataViewFilter<TextFilterArtifacts>(name)
	const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		setFilter(it => ({
			...it,
			query: e.target.value,
		}))
	}, [setFilter])

	return {
		value: state?.query ?? '',
		onChange,
	}
}
