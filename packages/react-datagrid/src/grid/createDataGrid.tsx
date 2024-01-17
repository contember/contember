import { Component, Environment, Filter, QueryLanguage, SugaredQualifiedEntityList } from '@contember/react-binding'
import { ComponentType, ReactNode } from 'react'
import { DataGridMethods, DataGridState } from '../types'
import { ControlledDataGridProps, createControlledDataGrid } from './createControlledDataGrid'
import { extractDataGridColumns } from '../internal/gridTemplateAnalyzer'
import { useDataGrid } from './useDataGrid'
import {
	DataGridColumnsContext,
	DataGridHidingMethodsContext,
	DataGridHidingStateContext, DataGridLayoutMethodsContext,
	DataGridLayoutStateContext,
} from '../internal/contexts'

export type DataGridProps<P extends {}> =
	& {
		dataGridKey?: string
		entities: SugaredQualifiedEntityList['entities']
		children: ReactNode
		itemsPerPage?: number | null
	}
	& P

export const createDataGrid = <P extends {}>(Renderer: ComponentType<P & ControlledDataGridProps>): ComponentType<DataGridProps<P>> => {
	const ControlledDataGrid = createControlledDataGrid(Renderer)

	return Component<DataGridProps<P>>(props => {
		const dataGridProps = useDataGrid(props)
		return (
			<DataGridColumnsContext.Provider value={dataGridProps.state.columns}>
				<DataGridHidingStateContext.Provider value={dataGridProps.state.hiddenColumns}>
					<DataGridHidingMethodsContext.Provider value={dataGridProps.methods.hiding}>
						<DataGridLayoutStateContext.Provider value={dataGridProps.state.layout}>
							<DataGridLayoutMethodsContext.Provider value={dataGridProps.methods.layout}>
								<ControlledDataGrid {...dataGridProps} {...(props as unknown as P)} />
							</DataGridLayoutMethodsContext.Provider>
						</DataGridLayoutStateContext.Provider>
					</DataGridHidingMethodsContext.Provider>
				</DataGridHidingStateContext.Provider>
			</DataGridColumnsContext.Provider>
		)
	}, (props, environment) => {
		const fakeState = createInitialState(props, environment)
		return <ControlledDataGrid state={fakeState} info={dummyInfo} methods={dummyStateMethods} {...(props as unknown as P)} />
	})
}

const dummyInfo = { paging: { pagesCount: undefined, totalCount: undefined } }
const dummyStateMethods: DataGridMethods = {
	layout: {
		setView: () => null,
	},
	hiding: {
		setIsColumnHidden: () => null,
	},
	filtering: {
		setFilter: () => null,
	},
	sorting: {
		setOrderBy: () => null,
	},
	paging: {
		goToPage: () => null,
		setItemsPerPage: () => null,
	},
}

const createInitialState = (props: DataGridProps<{}>, environment: Environment): DataGridState<any> => {
	const columns = extractDataGridColumns(props.children, environment)
	const entities = QueryLanguage.desugarQualifiedEntityList({ entities: props.entities }, environment)
	const filter: Filter = { and: [entities.filter ?? {}] }
	return {
		key: '_',
		columns,
		paging: {
			itemsPerPage: props.itemsPerPage ?? 50,
			pageIndex: 0,
		},
		filtering: {
			filter: filter,
			artifact: {},
			filterTypes: {},
		},
		hiddenColumns: {},
		sorting: {
			orderBy: [],
			directions: {},
		},
		entities: entities,
		layout: {
			view: 'default',
		},
	}
}
