import { Filter, QueryLanguage, useEnvironment } from '@contember/react-binding'
import { useSessionStorageState } from '@contember/react-utils'
import { useMemo } from 'react'
import { DataGridProps } from '../grid'
import { collectFilters } from './collectFilters'
import { collectOrderBy } from './collectOrderBy'
import { useFilters } from './useFilters'
import { useHiddenColumnsState } from './useHiddenColumnsState'
import { useOrderBys } from './useOrderBys'
import { useDataGridKey } from './useDataGridKey'
import { DataGridState, DataGridStateMethods } from '../types'
import { extractDataGridColumns } from './gridTemplateAnalyzer'
import { useGridPagingState } from './useGridPagingState'
import { DataGridLayout } from '../types/layout'

export const DATA_GRID_DEFAULT_ITEMS_PER_PAGE = 50

export const useDataGridState = (props: Pick<DataGridProps<{ tile?: unknown }>, 'children' | 'itemsPerPage' | 'entities' | 'dataGridKey' | 'tile'>): [DataGridState<any>, DataGridStateMethods] => {
	const dataGridKey = useDataGridKey(props)
	const environment = useEnvironment()
	const columns = useMemo(() => extractDataGridColumns(props.children), [props.children])
	const [pageState, updatePaging] = useGridPagingState(props.itemsPerPage ?? DATA_GRID_DEFAULT_ITEMS_PER_PAGE, dataGridKey)
	const [hiddenColumns, setIsColumnHidden] = useHiddenColumnsState(columns, dataGridKey)
	const [orderDirections, setOrderBy] = useOrderBys(columns, updatePaging, dataGridKey)
	const [filterArtifacts, setFilter] = useFilters(columns, updatePaging, dataGridKey)
	const entities = useMemo(() => QueryLanguage.desugarQualifiedEntityList({ entities: props.entities }, environment), [environment, props.entities])
	const [layout, setLayout] = useSessionStorageState<DataGridLayout>(`${dataGridKey}-layout`, layout => layout ?? (props.tile ? 'tiles' : 'default'))
	const desiredState = useMemo(
		(): DataGridState<any> => {
			const columnFilters = collectFilters(columns, filterArtifacts, environment)
			const filter: Filter = { and: [...columnFilters, entities.filter ?? {}] }
			const orderBy = collectOrderBy(columns, orderDirections, environment)

			return {
				paging: pageState,
				columns,
				hiddenColumns,
				filterArtifacts,
				orderDirections,
				entities,
				filter,
				layout,
				orderBy,
			}
		},
		[columns, filterArtifacts, environment, entities, pageState, hiddenColumns, orderDirections, layout],
	)
	return [
		desiredState,
		useMemo(() => ({ updatePaging, setFilter, setIsColumnHidden, setOrderBy, setLayout }), [updatePaging, setFilter, setIsColumnHidden, setOrderBy, setLayout]),
	]
}
