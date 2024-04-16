import { ReactNode, useState } from 'react'
import { Component, EntityListSubTree, MarkerTreeGenerator, QueryLanguage } from '@contember/react-binding'
import { useDataView, UseDataViewArgs } from '../hooks'
import { ControlledDataView } from './ControlledDataView'
import { DataViewLoader } from '../internal/components/DataViewLoader'
import { EntityAccessor, EntityListSubTreeMarker, Environment, FieldMarker, HasOneRelationMarker, MeaningfulMarker } from '@contember/binding'
import { ChildrenAnalyzer, Leaf } from '@contember/react-multipass-rendering'
import { DataViewFilter, DataViewFilterProps } from './filtering'
import { dataViewSelectionEnvironmentExtension } from '../env/dataViewSelectionEnvironmentExtension'
import { createUnionTextFilter, DataViewUnionFilterFields } from '../filterTypes'
import { getStateStorage, StateStorageOrName } from '@contember/react-utils'
import { dataViewKeyEnvironmentExtension } from '../env/dataViewKeyEnvironmentExtension'
import { DataViewStoredStateArgs, getDataViewCurrentPageStorageArgs, getDataViewFilteringStorageArgs, getDataViewPagingSettingStorageArgs, getDataViewSelectionStorageArgs, getDataViewSortingStorageArgs } from '../internal/stateStorage'
import { resolveFilters } from '../internal/hooks/useDataViewResolvedFilters'
import { resolveOrderBy } from '../internal/hooks/useDataViewSorting'


export type DataViewProps =
	& {
		children: ReactNode
		onSelectHighlighted?: (entity: EntityAccessor) => void
		queryField?: DataViewUnionFilterFields
	}
	& UseDataViewArgs

export const DataViewQueryFilterName = '_query'

export const DataView = Component<DataViewProps>((props, env) => {
	const [filterTypes] = useState(() => {
		return getFilterTypes(props, env)
	})

	const { state, methods, info } = useDataView({ ...props, filterTypes })

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
	const dataViewKey = props.dataViewKey ?? env.getExtension(dataViewKeyEnvironmentExtension)
	const pageSettingsStorage = getStoredValue(props.pagingSettingsStorage ?? 'null', ...getDataViewPagingSettingStorageArgs({ dataViewKey, initialItemsPerPage: props.initialItemsPerPage }))
	const currentPageStorage = getStoredValue(props.currentPageStateStorage ?? 'null', ...getDataViewCurrentPageStorageArgs({ dataViewKey }))
	const selectionStorage = getStoredValue(props.selectionStateStorage ?? 'null', ...getDataViewSelectionStorageArgs({ dataViewKey, initialSelection: props.initialSelection }))
	const filterArtifacts = getStoredValue(props.filteringStateStorage ?? 'null', ...getDataViewFilteringStorageArgs({ dataViewKey, initialFilters: props.initialFilters }))
	const sortingStorage = getStoredValue(props.sortingStateStorage ?? 'null', ...getDataViewSortingStorageArgs({ dataViewKey, initialSorting: props.initialSorting }))

	const filterTypes = getFilterTypes(props, env)
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
		selection: selectionStorage,
	}
}


const getFilterTypes = (props: DataViewProps, env: Environment) => {
	const selectionState = props.initialSelection && typeof props.initialSelection !== 'function' ? props.initialSelection : {}
	const envWithSelectionState = env.withExtension(dataViewSelectionEnvironmentExtension, selectionState)
	const entityListSubTree = <EntityListSubTree entities={props.entities}>{props.children}</EntityListSubTree>
	const filtersResult = dataViewFilterAnalyzer.processChildren(entityListSubTree, envWithSelectionState)

	const queryField = props.queryField ?? (() => {
		const markerTreeGenerator = new MarkerTreeGenerator(entityListSubTree, envWithSelectionState)
		const markerTree = markerTreeGenerator.generate()
		const marker = Array.from(markerTree.subTrees.values())[0]
		if (!(marker instanceof EntityListSubTreeMarker)) {
			throw new Error()
		}
		return extractStringFields(marker)
	})()

	return {
		...(!queryField || (Array.isArray(queryField) && queryField.length === 0) ? {} : { [DataViewQueryFilterName]: createUnionTextFilter(queryField) }),
		...Object.fromEntries(filtersResult.map(it => [it.name, it.filterHandler])),
		...props.filterTypes,
	}
}

const filterLeaf = new Leaf(node => node.props, DataViewFilter)


export const dataViewFilterAnalyzer = new ChildrenAnalyzer<
	DataViewFilterProps,
	never,
	Environment
>([filterLeaf], {
	staticRenderFactoryName: 'staticRender',
	staticContextFactoryName: 'generateEnvironment',
})


const extractStringFields = (marker: Exclude<MeaningfulMarker, FieldMarker>): string[] => {
	const node = marker.environment.getSubTreeNode()
	const textFields = []
	for (const field of marker.fields.markers.values()) {
		if (field instanceof FieldMarker) {
			const columnInfo = node.entity.fields.get(field.fieldName)
			if (columnInfo?.type === 'String') {
				textFields.push(field.fieldName)
			}
		} else if (field instanceof HasOneRelationMarker) {
			textFields.push(...extractStringFields(field).map(it => `${field.parameters.field}.${it}`))
		}
	}
	return textFields
}
