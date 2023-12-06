import { Component, Environment, QueryLanguage, SugaredQualifiedEntityList } from '@contember/react-binding'
import { ComponentType, ReactNode } from 'react'
import { DataGridRendererProps, DataGridState, DataGridStateMethods } from '../types'
import { createControlledDataGrid } from './createControlledDataGrid'
import { extractDataGridColumns } from '../internal/gridTemplateAnalyzer'
import { DATA_GRID_DEFAULT_ITEMS_PER_PAGE } from '../internal/useDataGridState'
import { useDataGrid } from './useDataGrid'

export type DataGridProps<P extends {}> =
	& {
		dataGridKey?: string
		entities: SugaredQualifiedEntityList['entities']
		children: ReactNode
		itemsPerPage?: number | null
	}
	& P

export const createDataGrid = <P extends {}>(Renderer: ComponentType<DataGridRendererProps<any> & P>): ComponentType<DataGridProps<Omit<P, keyof DataGridRendererProps<any>>>> => {
	const ControlledDataGrid = createControlledDataGrid(Renderer)

	return Component<DataGridProps<Omit<P, keyof DataGridRendererProps<any>>>>(props => {
		return <ControlledDataGrid {...useDataGrid(props)} />
	}, (props, environment) => {
		const fakeState = createInitialState(props, environment)
		return <ControlledDataGrid state={fakeState} stateMethods={dummyStateMethods} {...props} />
	})
}

const dummyStateMethods: DataGridStateMethods = {
	setFilter: () => null,
	setIsColumnHidden: () => null,
	setOrderBy: () => null,
	updatePaging: () => null,
	setLayout: () => null,
}

const createInitialState = (props: DataGridProps<{}>, environment: Environment): DataGridState<any> => {
	const columns = extractDataGridColumns(props.children, environment)
	return {
		columns,
		paging: {
			itemsPerPage: props.itemsPerPage ?? DATA_GRID_DEFAULT_ITEMS_PER_PAGE,
			pageIndex: 0,
		},
		hiddenColumns: {},
		filterArtifacts: {},
		orderDirections: {},
		orderBy: [],
		entities: QueryLanguage.desugarQualifiedEntityList({ entities: props.entities }, environment),
		filter: { and: [{}] },
		layout: 'default',
	}
}
