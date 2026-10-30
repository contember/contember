import { ChangeEvent, useCallback, useState } from 'react'
import { useDataViewFilter } from '../../useDataViewFilter.js'
import { DateRangeFilterArtifacts } from '../../../filterTypes/index.js'
import { isCompleteDate } from '../../../internal/helpers/isCompleteDate.js'

export interface UseDataViewDateFilterInputResult {
	value: string
	onChange: (e: ChangeEvent<HTMLInputElement>) => void
	onBlur: () => void
}

export type UseDataViewDateFilterInputProps = {
	name: string
	type: 'start' | 'end'
}

type Draft = {
	value: string
	committed: string | undefined
}

export const useDataViewDateFilterInput = ({ name, type }: UseDataViewDateFilterInputProps): UseDataViewDateFilterInputResult => {
	const [state, setFilter] = useDataViewFilter<DateRangeFilterArtifacts>(name)
	const committed = state?.[type]
	// An incomplete value stays local until it becomes a complete date. Leaving the input or a filter change from elsewhere
	// discards it, so the input never shows a date the data view is not filtered by.
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
	const onBlur = useCallback(() => setDraft(undefined), [])

	return {
		value: draft !== undefined && draft.committed === committed ? draft.value : committed ?? '',
		onChange,
		onBlur,
	}
}
