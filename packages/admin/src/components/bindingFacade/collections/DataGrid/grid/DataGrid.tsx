import { Component, SugaredQualifiedEntityList, useBindingOperations, useEnvironment } from '@contember/binding'
import { noop } from '@contember/react-utils'
import * as React from 'react'
import { useGridPagingState } from '../paging'
import { extractDataGridColumns } from '../structure'
import { DataGridState } from './DataGridState'
import { normalizeInitialFilters } from './normalizeInitialFilters'
import { normalizeInitialOrderBys } from './normalizeInitialOrderBys'
import { renderGrid, RenderGridOptions } from './renderGrid'
import { useOrderBys } from './useOrderBys'

export interface DataGridProps {
	entities: SugaredQualifiedEntityList['entities']
	children: React.ReactNode

	itemsPerPage?: number | null
}

export const DataGrid = Component<DataGridProps>(
	props => {
		const { extendTree } = useBindingOperations()
		const isMountedRef = React.useRef(true)
		const environment = useEnvironment()

		const columns = React.useMemo(() => extractDataGridColumns(props.children), [props.children])

		const [pageState, updatePaging] = useGridPagingState({
			itemsPerPage: props.itemsPerPage ?? null,
		})
		const [orderBys, setOrderBy] = useOrderBys(columns, updatePaging)

		const gridOptions = React.useMemo(
			(): RenderGridOptions => ({
				entities: props.entities,
				updatePaging,
				setOrderBy,
			}),
			[props.entities, updatePaging, setOrderBy],
		)

		const loadAbortControllerRef = React.useRef<AbortController | undefined>(undefined)

		const desiredState = React.useMemo(
			(): DataGridState => ({
				paging: pageState,
				columns,
				filters: new Map(),
				orderBys,
			}),
			[orderBys, pageState, columns],
		)

		const [displayedState, setDisplayedState] = React.useState(desiredState)

		React.useEffect(() => {
			const extend = async () => {
				if (displayedState === desiredState) {
					return
				}
				loadAbortControllerRef.current?.abort()

				const newController = new AbortController()
				loadAbortControllerRef.current = newController

				try {
					await extendTree(renderGrid(gridOptions, desiredState, environment), {
						signal: newController.signal,
					})
				} catch {
					// TODO Distinguish abort vs actual error
				}
				if (!isMountedRef.current) {
					return
				}
				setDisplayedState(desiredState)
			}
			extend()
		}, [desiredState, displayedState, environment, extendTree, gridOptions])

		return renderGrid(gridOptions, displayedState, environment)
	},
	(props, environment) => {
		const columns = extractDataGridColumns(props.children)

		return renderGrid(
			{
				entities: props.entities,
				updatePaging: noop,
				setOrderBy: noop,
			},
			{
				columns,
				paging: {
					itemsPerPage: props.itemsPerPage ?? null,
					pageIndex: 0,
				},
				filters: normalizeInitialFilters(columns),
				orderBys: normalizeInitialOrderBys(columns),
			},
			environment,
		)
	},
	'DataGrid',
)
