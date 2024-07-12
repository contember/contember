import { ChangeEvent, useCallback } from 'react'
import { useDataViewFilter } from '../../useDataViewFilter'
import { DateRangeFilterArtifacts } from '../../../filterTypes'

export interface UseDataViewDateFilterInputResult {
	value: string
	onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

export type UseDataViewDateFilterInputProps = {
	name: string
	type: 'start' | 'end'
}

export const useDataViewDateFilterInput = ({ name, type }: UseDataViewDateFilterInputProps): UseDataViewDateFilterInputResult => {
	const [state, setFilter] = useDataViewFilter<DateRangeFilterArtifacts>(name)
	const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		setFilter(it => ({
			...it,
			[type]: e.target.value && e.target.value.match(/\d{4}-\d{2}-\d{2}/) ? e.target.value : undefined,
		}))
	}, [setFilter, type])

	return {
		value: state?.[type] ?? '',
		onChange,
	}
}
