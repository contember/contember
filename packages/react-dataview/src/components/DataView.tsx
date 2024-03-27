import { ReactNode, useState } from 'react'
import { Component, EntityListSubTree, MarkerTreeGenerator, QueryLanguage } from '@contember/react-binding'
import { useDataView, UseDataViewArgs } from '../hooks'
import { ControlledDataView } from './ControlledDataView'
import { DataViewLoader } from '../internal/components/DataViewLoader'
import { DATA_VIEW_DEFAULT_ITEMS_PER_PAGE } from '../internal/hooks/useDataViewPaging'
import { EntityAccessor, EntityListSubTreeMarker, Environment, FieldMarker, HasOneRelationMarker, MeaningfulMarker } from '@contember/binding'
import { ChildrenAnalyzer, Leaf } from '@contember/react-multipass-rendering'
import { DataViewFilter, DataViewFilterProps } from './filtering'
import { dataViewSelectionEnvironmentExtension } from '../dataViewSelectionEnvironmentExtension'
import { createUnionTextFilter, DataViewUnionFilterFields } from '../filterTypes'


export type DataViewProps =
	& {
		children: ReactNode
		onSelectHighlighted?: (entity: EntityAccessor) => void
		queryField?: DataViewUnionFilterFields
	}
	& UseDataViewArgs

export const DataView = Component<DataViewProps>((props, env) => {
	const [filterTypes] = useState(() => {
		const state = resolveInitialState(props, env)
		const envWithSelectionState = env.withExtension(dataViewSelectionEnvironmentExtension, state.selection)
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
			_query: createUnionTextFilter(queryField),
			...Object.fromEntries(filtersResult.map(it => [it.name, it.filterHandler])),
			...props.filterTypes,
		}
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

const resolveInitialState = (props: DataViewProps, env: Environment) => {
	return {
		key: '_',
		entities: QueryLanguage.desugarQualifiedEntityList({ entities: props.entities }, env),
		paging: {
			pageIndex: 0,
			itemsPerPage: props.initialItemsPerPage ?? DATA_VIEW_DEFAULT_ITEMS_PER_PAGE,
		},
		filtering: {
			filter: {
				and: [{}],
			},
			filterTypes: {},
			artifact: {},
		},
		sorting: {
			orderBy: [],
			directions: {},
		},
		selection: {
			values: props.initialSelection && typeof props.initialSelection !== 'function' ? props.initialSelection : {},
			fallback: props.selectionFallback === undefined ? true : props.selectionFallback,
		},
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
