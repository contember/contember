import { useDataViewFilter } from '../../index'
import { BooleanFilterArtifacts } from '../../../filterTypes'
import { useCallback, useMemo } from 'react'

export type DataViewSetBooleanFilterAction = 'include' | 'unset' | 'toggle'
export type DataViewBooleanFilterCurrent = 'include' | 'none'
export type UseDataViewBooleanFilter = [
	current: DataViewBooleanFilterCurrent,
	set: (value: DataViewSetBooleanFilterAction) => void
]

export const useDataViewBooleanFilter = (name: string, value: boolean): UseDataViewBooleanFilter => {
	const factory = useDataViewBooleanFilterFactory(name)
	return useMemo(() => factory(value), [factory, value])
}

export const useDataViewBooleanFilterFactory = (name: string) => {
	const [filter, setFilter] = useDataViewFilter<BooleanFilterArtifacts>(name)

	return useCallback((value: boolean): UseDataViewBooleanFilter => {

		const key = value ? 'includeTrue' : 'includeFalse'

		const current = filter?.[key] ? 'include' : 'none'

		const set = ((action: DataViewSetBooleanFilterAction = 'include') => {
			switch (action) {
				case 'unset':
					setFilter(it => ({
						...it,
						[key]: undefined,
					}))
					return
				case 'toggle':
					setFilter(it => ({
						...it,
						[key]: it?.[key] === true ? undefined : true,
					}))
					return
				case 'include':
					setFilter(it => ({
						...it,
						[key]: true,
					}))
					return
			}
		})

		return [current, set]

	}, [filter, setFilter])
}
