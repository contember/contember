import { useDataViewFilter } from '../../index'
import { useCallback } from 'react'

export type DataViewSetNullFilterAction = 'include' | 'exclude' | 'unset' | 'toggleInclude' | 'toggleExclude'
export type DataViewNullFilterState = 'include' | 'exclude' | 'none'

export type UseDataViewNullFilterResult = [
	state: DataViewNullFilterState,
	set: (action: DataViewSetNullFilterAction) => void
]

export const useDataViewNullFilter = (name: string): UseDataViewNullFilterResult => {
	const [state, setFilter] = useDataViewFilter<{ nullCondition?: boolean }>(name)
	const cb = useCallback((action: DataViewSetNullFilterAction) => {
		switch (action) {
			case 'unset':
				setFilter(it => ({
					...it,
					nullCondition: undefined,
				}))
				return
			case 'toggleInclude':
				setFilter(it => ({
					...it,
					nullCondition: it?.nullCondition === true ? undefined : true,
				}))
				return
			case 'toggleExclude':
				setFilter(it => ({
					...it,
					nullCondition: it?.nullCondition === false ? undefined : false,
				}))
				return
			case 'include':
				setFilter(it => ({
					...it,
					nullCondition: true,
				}))
				return
			case 'exclude':
				setFilter(it => ({
					...it,
					nullCondition: false,
				}))
				return
		}
	}, [setFilter])

	const currentState: DataViewNullFilterState = state?.nullCondition
		? 'include'
		: state?.nullCondition === false
		? 'exclude' : 'none'

	return [currentState, cb]
}
