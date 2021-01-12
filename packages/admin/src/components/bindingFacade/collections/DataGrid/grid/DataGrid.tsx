import { Component, useBindingOperations } from '@contember/binding'
import { noop } from '@contember/react-utils'
import * as React from 'react'
import { useGridPagingState } from '../paging'
import { extractDataGridColumns } from '../structure'
import { DataGridState } from './DataGridState'
import { normalizeInitialFilters } from './normalizeInitialFilters'
import { normalizeInitialOrderBys } from './normalizeInitialOrderBys'
import { renderGrid, RenderGridOptions } from './renderGrid'

export interface DataGridProps {
	entityName: string
	children: React.ReactNode

	itemsPerPage?: number | null
}

export const DataGrid = Component<DataGridProps>(
	props => {
		const { extendTree } = useBindingOperations()
		const isMountedRef = React.useRef(true)

		const columns = React.useMemo(() => extractDataGridColumns(props.children), [props.children])

		const [pageState, updatePaging] = useGridPagingState({
			itemsPerPage: props.itemsPerPage ?? null,
		})
		const gridOptions = React.useMemo(
			(): RenderGridOptions => ({
				entityName: props.entityName,
				updatePaging,
				setOrderBy: noop,
			}),
			[props.entityName, updatePaging],
		)

		const loadAbortControllerRef = React.useRef<AbortController | undefined>(undefined)

		const desiredState = React.useMemo(
			(): DataGridState => ({
				paging: pageState,
				columns,
				filters: new Map(),
				orderBys: new Map(),
			}),
			[columns, pageState],
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
					await extendTree(renderGrid(gridOptions, desiredState), {
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
		}, [desiredState, displayedState, extendTree, gridOptions])

		return renderGrid(gridOptions, displayedState)
	},
	props => {
		const columns = extractDataGridColumns(props.children)

		return renderGrid(
			{
				entityName: props.entityName,
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
		)
	},
	'DataGrid',
)
