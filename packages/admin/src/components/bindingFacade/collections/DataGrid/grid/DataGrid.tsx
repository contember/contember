import { Component, useBindingOperations } from '@contember/binding'
import * as React from 'react'
import { useGridPagingState } from '../paging'
import { extractDataGridColumns } from '../structure'
import { DataGridState } from './DataGridState'
import { normalizeInitialFilters } from './normalizeInitialFilters'
import { normalizeInitialOrderBys } from './normalizeInitialOrderBys'
import { renderGrid } from './renderGrid'

export interface DataGridProps {
	entityName: string
	children: React.ReactNode

	itemsPerPage?: number | null
}

export const DataGrid = Component<DataGridProps>(
	props => {
		const { hasSubTree, extendTree } = useBindingOperations()
		const isMountedRef = React.useRef(true)

		const columns = React.useMemo(() => extractDataGridColumns(props.children), [props.children])

		const [pageState, updatePaging] = useGridPagingState({
			itemsPerPage: props.itemsPerPage ?? null,
		})

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
					await extendTree(renderGrid(props.entityName, desiredState), {
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
		}, [desiredState, displayedState, extendTree, props.entityName])

		return renderGrid(props.entityName, displayedState)
	},
	props => {
		const columns = extractDataGridColumns(props.children)

		return renderGrid(props.entityName, {
			columns,
			paging: {
				itemsPerPage: props.itemsPerPage ?? null,
				pageIndex: 0,
			},
			filters: normalizeInitialFilters(columns),
			orderBys: normalizeInitialOrderBys(columns),
		})
	},
	'DataGrid',
)
