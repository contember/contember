import { ChangeEvent, useCallback, useState } from 'react'
import { useDataViewFilter } from '../../useDataViewFilter.js'
import { DateRangeFilterArtifacts } from '../../../filterTypes/index.js'

export interface UseDataViewDateFilterInputResult {
	value: string
	onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

export type UseDataViewDateFilterInputProps = {
	name: string
	type: 'start' | 'end'
}

// A date input reports every keystroke of the year, so typing 2020 passes through 0002, 0020 and 0202.
const isCompleteDate = (value: string) => {
	const match = value.match(/^(\d{4})-\d{2}-\d{2}$/)
	return match !== null && Number(match[1]) >= 1000
}

type Draft = {
	value: string
	committed: string | undefined
}

export const useDataViewDateFilterInput = ({ name, type }: UseDataViewDateFilterInputProps): UseDataViewDateFilterInputResult => {
	const [state, setFilter] = useDataViewFilter<DateRangeFilterArtifacts>(name)
	const committed = state?.[type]
	// An incomplete value stays local until it becomes a complete date; a filter change from elsewhere discards it.
	const [draft, setDraft] = useState<Draft>()
	const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value
		if (value !== '' && !isCompleteDate(value)) {
			setDraft({ value, committed })
			return
		}
		setDraft(undefined)
		setFilter(it => ({
			...it,
			[type]: value !== '' ? value : undefined,
		}))
	}, [committed, setFilter, type])

	return {
		value: draft !== undefined && draft.committed === committed ? draft.value : committed ?? '',
		onChange,
	}
}
