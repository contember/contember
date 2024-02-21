import { Component, Environment, Filter, QueryLanguage, SugaredQualifiedEntityList } from '@contember/react-binding'
import { ComponentType, ReactNode } from 'react'
import { DataGridMethods, DataGridState } from '../types'
import { ControlledDataGridProps, createControlledDataGrid } from './createControlledDataGrid'
import { extractDataGridColumns } from '../internal/gridTemplateAnalyzer'
import { useDataGrid } from './useDataGrid'
import { DataGridColumnsContext } from '../internal/contexts'

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
			<DataGridColumnsContext.Provider value={dataGridProps.columns}>
				<ControlledDataGrid {...dataGridProps} {...(props as unknown as P)} />
			</DataGridColumnsContext.Provider>
		)
	}, (props, environment) => {
		const fakeState = createInitialState(props, environment)
		const columns = extractDataGridColumns(props.children, environment)
		return <ControlledDataGrid state={fakeState} info={dummyInfo} methods={dummyStateMethods} columns={columns} {...(props as unknown as P)} />
	})
}

const dummyInfo = { paging: { pagesCount: undefined, totalCount: undefined } }
const dummyStateMethods: DataGridMethods = {

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
	selection: {
		setSelection: () => null,
	},
}

const createInitialState = (props: DataGridProps<{}>, environment: Environment): DataGridState => {

	const entities = QueryLanguage.desugarQualifiedEntityList({ entities: props.entities }, environment)
	const filter: Filter = { and: [entities.filter ?? {}] }
	return {
		key: '_',
		paging: {
			itemsPerPage: props.itemsPerPage ?? 50,
			pageIndex: 0,
		},
		filtering: {
			filter: filter,
			artifact: {},
			filterTypes: {},
		},
		selection: {
			values: {
			},
		},
		sorting: {
			orderBy: [],
			directions: {},
		},
		entities: entities,
	}
}
