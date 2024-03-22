import { ReactNode, useState } from 'react'
import { Component, EntityListSubTree, QueryLanguage } from '@contember/react-binding'
import { useDataView, UseDataViewArgs } from '../hooks'
import { ControlledDataView } from './ControlledDataView'
import { DataViewLoader } from '../internal/components/DataViewLoader'
import { DATA_VIEW_DEFAULT_ITEMS_PER_PAGE } from '../internal/hooks/useDataViewPaging'
import { EntityAccessor, Environment } from '@contember/binding'
import { ChildrenAnalyzer, Leaf } from '@contember/react-multipass-rendering'
import { DataViewFilter, DataViewFilterProps } from './filtering'
import { dataViewSelectionEnvironmentExtension } from '../dataViewSelectionEnvironmentExtension'


export type DataViewProps =
	& {
		children: ReactNode
		onSelectHighlighted?: (entity: EntityAccessor) => void
	}
	& UseDataViewArgs

export const DataView = Component<DataViewProps>((props, env) => {
	const [filterTypes] = useState(() => {
		const state = resolveInitialState(props, env)
		const result = dataViewFilterAnalyzer.processChildren(
			<EntityListSubTree entities={props.entities}>{props.children}</EntityListSubTree>,
			env.withExtension(dataViewSelectionEnvironmentExtension, state.selection),
		)
		return {
			...Object.fromEntries(result.map(it => [it.name, it.filterHandler])),
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
