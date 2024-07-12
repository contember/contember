import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useDataViewFilter } from '../../useDataViewFilter'
import { TextFilterArtifacts } from '../../../filterTypes'

export interface UseDataViewTextFilterInputResult {
	value: string
	onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

export const useDataViewTextFilterInput = ({ name, debounceMs = 500 }: { name: string; debounceMs?: number }): UseDataViewTextFilterInputResult => {
	const [state, setFilter] = useDataViewFilter<TextFilterArtifacts>(name)
	const [value, setValue] = useState(state?.query ?? '')
	const timerRef = useRef<ReturnType<typeof setTimeout>>()
	useEffect(() => {
		if (!timerRef.current) {
			setValue(state?.query ?? '')
		}
	}, [state?.query])

	const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		if (debounceMs && e.target.value) {
			timerRef.current && clearTimeout(timerRef.current)
			timerRef.current = undefined

			timerRef.current = setTimeout(() => {
				timerRef.current = undefined
				setFilter(it => ({
					...it,
					query: e.target.value,
				}))
			}, debounceMs)

		} else {
			setFilter(it => ({
				...it,
				query: e.target.value,
			}))
		}
		setValue(e.target.value)

	}, [debounceMs, setFilter])

	return {
		value,
		onChange,
	}
}
