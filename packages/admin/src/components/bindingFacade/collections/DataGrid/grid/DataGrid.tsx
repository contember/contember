import { Component, SugaredQualifiedEntityList, useBindingOperations, useEnvironment } from '@contember/binding'
import { noop } from '@contember/react-utils'
import * as React from 'react'
import { useGridPagingState } from '../paging'
import { extractDataGridColumns } from '../structure'
import { DataGridState } from './DataGridState'
import { normalizeInitialFilters } from './normalizeInitialFilters'
import { normalizeInitialOrderBys } from './normalizeInitialOrderBys'
import { renderGrid, RenderGridOptions } from './renderGrid'
import { useFilters } from './useFilters'
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
		const [orderDirections, setOrderBy] = useOrderBys(columns, updatePaging)
		const [filterArtifacts, setFilter] = useFilters(columns, updatePaging)

		const gridOptions = React.useMemo(
			(): RenderGridOptions => ({
				entities: props.entities,
				updatePaging,
				setFilter,
				setOrderBy,
			}),
			[props.entities, updatePaging, setFilter, setOrderBy],
		)

		const loadAbortControllerRef = React.useRef<AbortController | undefined>(undefined)

		const desiredState = React.useMemo(
			(): DataGridState => ({
				paging: pageState,
				columns,
				filterArtifacts,
				orderDirections,
			}),
			[filterArtifacts, orderDirections, pageState, columns],
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
					return
				}
				if (!isMountedRef.current) {
					return
				}
				setDisplayedState(desiredState)
			}
			extend()
		}, [desiredState, displayedState, environment, extendTree, gridOptions])

		React.useEffect(
			() => () => {
				isMountedRef.current = false
			},
			[],
		)

		return renderGrid(gridOptions, displayedState, environment)
	},
	(props, environment) => {
		const columns = extractDataGridColumns(props.children)

		return renderGrid(
			{
				entities: props.entities,
				updatePaging: noop,
				setOrderBy: noop,
				setFilter: noop,
			},
			{
				columns,
				paging: {
					itemsPerPage: props.itemsPerPage ?? null,
					pageIndex: 0,
				},
				filterArtifacts: normalizeInitialFilters(columns),
				orderDirections: normalizeInitialOrderBys(columns),
			},
			environment,
		)
	},
	'DataGrid',
)
