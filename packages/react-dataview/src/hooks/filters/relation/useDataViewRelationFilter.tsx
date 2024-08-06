import { useCallback, useMemo } from 'react'
import { useDataViewFilter } from '../../index'
import { RelationFilterArtifacts } from '../../../filterTypes'
import { EntityId } from '@contember/react-binding'

export type DataViewSetRelationFilterAction = 'include' | 'exclude' | 'unset' | 'toggleInclude' | 'toggleExclude'
export type DataViewRelationFilterCurrent = 'include' | 'exclude' | 'none'
export type UseDataViewRelationFilterResult = [
	current: DataViewRelationFilterCurrent,
	set: (value: DataViewSetRelationFilterAction) => void
]
export const useDataViewRelationFilter = (name: string, entityId: EntityId): UseDataViewRelationFilterResult => {
	const factory = useDataViewRelationFilterFactory(name)

	return useMemo(() => factory(entityId), [entityId, factory])
}
export const useDataViewRelationFilterFactory = (name: string) => {
	const [filter, setFilter] = useDataViewFilter<RelationFilterArtifacts>(name)
	return useCallback((id: EntityId): UseDataViewRelationFilterResult => {

		const current = (() => {
			if (filter?.id?.includes(id)) {
				return 'include'
			}
			if (filter?.notId?.includes(id)) {
				return 'exclude'
			}
			return 'none'
		})()

		const set = (action: DataViewSetRelationFilterAction = 'include') => {
			switch (action) {
				case 'unset':
					setFilter(it => ({
						...it,
						id: it?.id?.filter(it => it !== id),
						notId: it?.notId?.filter(it => it !== id),
					}))
					return
				case 'toggleInclude':
					setFilter(it => ({
						...it,
						id: it?.id?.includes(id) ? it?.id?.filter(it => it !== id) : [...(it?.id ?? []), id],
						notId: it?.notId?.filter(it => it !== id),
					}))
					return
				case 'toggleExclude':
					setFilter(it => ({
						...it,
						notId: it?.notId?.includes(id) ? it?.notId?.filter(it => it !== id) : [...(it?.notId ?? []), id],
						id: it?.id?.filter(it => it !== id),
					}))
					return
				case 'include':
					setFilter(it => ({
						...it,
						id: [...(it?.id ?? []), id],
						notId: it?.notId?.filter(it => it !== id),
					}))
					return
				case 'exclude':
					setFilter(it => ({
						...it,
						notId: [...(it?.notId ?? []), id],
						id: it?.id?.filter(it => it !== id),
					}))
					return
			}
		}

		return [current, set]
	}, [filter?.id, filter?.notId, setFilter])
}
