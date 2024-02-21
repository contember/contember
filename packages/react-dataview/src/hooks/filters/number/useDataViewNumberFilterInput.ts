import { ChangeEvent, useCallback } from 'react'
import { useDataViewFilter } from '../../useDataViewFilter'
import { NumberRangeFilterArtifacts } from '../../../filterTypes'

export interface UseDataViewNumberFilterInputResult {
	value: string
	onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

export type UseDataViewNumberFilterInputProps = {
	name: string
	type: 'from' | 'to'
	allowFloat?: boolean
}

export const useDataViewNumberFilterInput = ({ name, type, allowFloat }: UseDataViewNumberFilterInputProps): UseDataViewNumberFilterInputResult => {
	const [state, setFilter] = useDataViewFilter<NumberRangeFilterArtifacts>(name)
	const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		setFilter(it => ({
			...it,
			[type]: e.target.value ? (allowFloat ? parseFloat(e.target.value) : parseInt(e.target.value, 10)) : undefined,
		}))
	}, [allowFloat, setFilter, type])

	return {
		value: state?.[type]?.toString() ?? '',
		onChange,
	}
}
