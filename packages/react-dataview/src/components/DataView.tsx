import { ReactNode, useState } from 'react'
import { Component, EntityAccessor, Environment, QueryLanguage } from '@contember/react-binding'
import { useDataView, UseDataViewArgs } from '../hooks'
import { ControlledDataView } from './ControlledDataView'
import { DataViewLoader } from '../internal/components/DataViewLoader'
import { DataViewUnionFilterFields } from '../filterTypes'
import { getStateStorage, StateStorageOrName } from '@contember/react-utils'
import {
	DataViewStoredStateArgs,
	getDataViewCurrentPageStorageArgs,
	getDataViewFilteringStorageArgs,
	getDataViewPagingSettingStorageArgs,
	getDataViewSelectionStorageArgs,
	getDataViewSortingStorageArgs,
} from '../internal/stateStorage'
import { resolveFilters } from '../internal/hooks/useDataViewResolvedFilters'
import { resolveOrderBy } from '../internal/hooks/useDataViewSorting'
import { collectStaticInfo } from '../internal/helpers/staticAnalyzer'
import { getDataViewKey } from '../internal/helpers/getDataViewKey'


export type DataViewProps =
	& {
		children: ReactNode
		onSelectHighlighted?: (entity: EntityAccessor) => void
		queryField?: DataViewUnionFilterFields
	}
	& UseDataViewArgs

export const DataViewQueryFilterName = '_query'

/**
 * The root component for DataView. It initializes the DataView state and provides the DataView context.
 *
 * #### Example
 * ```tsx
 * <DataView entities={'Post'}>
 *     // DataView content here
 * </DataView>
 * ```
 */
export const DataView = Component<DataViewProps>((props, env) => {
	const [{ filterTypes, layouts }] = useState(() => {
		return collectStaticInfo(props, env)
	})

	const { state, methods, info } = useDataView({ layouts, ...props, filterTypes })

	return (
		<ControlledDataView state={state} methods={methods} info={info} onSelectHighlighted={props.onSelectHighlighted}>
			{props.children}
		</ControlledDataView>
	)
}, (props, env) => {
	return (
		<DataViewLoader children={props.children} state={resolveInitialState(props, env)} />
	)
})

const getStoredValue = <V, >(storage: StateStorageOrName | StateStorageOrName[], ...[key, initializer]: DataViewStoredStateArgs<V>): V => {
	const storageInstance = getStateStorage(storage)
	const storedValue = storageInstance.getItem(key)
	return initializer(storedValue as V)
}

const resolveInitialState = (props: DataViewProps, env: Environment) => {
	const dataViewKey = getDataViewKey(env, props)
	const { filterTypes, layouts } = collectStaticInfo(props, env)

	const pageSettingsStorage = getStoredValue(props.pagingSettingsStorage ?? 'null', ...getDataViewPagingSettingStorageArgs({ dataViewKey, initialItemsPerPage: props.initialItemsPerPage }))
	const currentPageStorage = getStoredValue(props.currentPageStateStorage ?? 'null', ...getDataViewCurrentPageStorageArgs({ dataViewKey }))
	const selectionStorage = getStoredValue(props.selectionStateStorage ?? 'null', ...getDataViewSelectionStorageArgs({ dataViewKey, initialSelection: props.initialSelection, defaultLayout: layouts[0]?.name }))
	const filterArtifacts = getStoredValue(props.filteringStateStorage ?? 'null', ...getDataViewFilteringStorageArgs({ dataViewKey, initialFilters: props.initialFilters }))
	const sortingStorage = getStoredValue(props.sortingStateStorage ?? 'null', ...getDataViewSortingStorageArgs({ dataViewKey, initialSorting: props.initialSorting }))

	const entities = QueryLanguage.desugarQualifiedEntityList({ entities: props.entities }, env)
	const resolvedFilter = resolveFilters({ entities, filterTypes, filters: filterArtifacts, environment: env })

	return {
		key: '_',
		entities: QueryLanguage.desugarQualifiedEntityList({ entities: props.entities }, env),
		paging: {
			pageIndex: currentPageStorage.pageIndex,
			itemsPerPage: pageSettingsStorage.itemsPerPage,
		},
		filtering: {
			filter: resolvedFilter,
			filterTypes,
			artifact: filterArtifacts,
		},
		sorting: {
			orderBy: resolveOrderBy({ directions: sortingStorage, environment: env }),
			directions: sortingStorage,
		},
		selection: {
			values: selectionStorage,
			layouts,
		},
	}
}

