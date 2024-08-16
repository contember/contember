import { useDataViewFilter } from '../../index'
import { EnumFilterArtifacts } from '../../../filterTypes'
import { useCallback, useMemo } from 'react'

export type DataViewSetEnumFilterAction = 'include' | 'exclude' | 'unset' | 'toggleInclude' | 'toggleExclude'
export type DataViewEnumFilterCurrent = 'include' | 'exclude' | 'none'
export type UseDataViewEnumFilter = [
	current: DataViewEnumFilterCurrent,
	set: (value: DataViewSetEnumFilterAction) => void
]

export const useDataViewEnumFilter = (name: string, value: string): UseDataViewEnumFilter => {
	const factory = useDataViewEnumFilterFactory(name)
	return useMemo(() => factory(value), [factory, value])
}

export const useDataViewEnumFilterFactory = (name: string) => {
	const [filter, setFilter] = useDataViewFilter<EnumFilterArtifacts>(name)

	return useCallback((value: string): UseDataViewEnumFilter => {

		const current = (() => {
			if (filter?.values?.includes(value)) {
				return 'include'
			}
			if (filter?.notValues?.includes(value)) {
				return 'exclude'
			}
			return 'none'
		})()

		const set = ((action: DataViewSetEnumFilterAction = 'include') => {
			switch (action) {
				case 'unset':
					setFilter(it => ({
						...it,
						values: it?.values?.filter(it => it !== value),
						notValues: it?.notValues?.filter(it => it !== value),
					}))
					return
				case 'toggleInclude':
					setFilter(it => ({
						...it,
						values: it?.values?.includes(value) ? it?.values?.filter(it => it !== value) : [...(it?.values ?? []), value],
						notValues: it?.notValues?.filter(it => it !== value),
					}))
					return
				case 'toggleExclude':
					setFilter(it => ({
						...it,
						notValues: it?.notValues?.includes(value) ? it?.notValues?.filter(it => it !== value) : [...(it?.notValues ?? []), value],
						values: it?.values?.filter(it => it !== value),
					}))
					return
				case 'include':
					setFilter(it => ({
						...it,
						value: [...(it?.values ?? []), value],
						notValues: it?.notValues?.filter(it => it !== value),
					}))
					return
				case 'exclude':
					setFilter(it => ({
						...it,
						notValues: [...(it?.notValues ?? []), value],
						value: it?.values?.filter(it => it !== value),
					}))
					return
			}
		})

		return [current, set]

	}, [filter?.notValues, filter?.values, setFilter])
}
