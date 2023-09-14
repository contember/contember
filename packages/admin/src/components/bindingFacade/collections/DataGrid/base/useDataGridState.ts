import { Filter, QueryLanguage, useEnvironment } from '@contember/react-binding'
import { useSessionStorageState } from '@contember/react-utils'
import { useMemo } from 'react'
import { DataGridProps } from '../grid'
import { collectFilters } from '../grid/collectFilters'
import { collectOrderBy } from '../grid/collectOrderBy'
import { useFilters } from '../grid/useFilters'
import { useHiddenColumnsState } from '../grid/useHiddenColumnsState'
import { useOrderBys } from '../grid/useOrderBys'
import { useGridPagingState } from '../paging'
import { extractDataGridColumns } from '../structure'
import { DataGridLayout } from './DataGridLayout'
import { DataGridState, DataGridStateMethods } from './DataGridState'
import { useDataGridKey } from './useDataGridKey'

export const DATA_GRID_DEFAULT_ITEMS_PER_PAGE = 50

export const useDataGridState = (props: Pick<DataGridProps<any>, 'children' | 'itemsPerPage' | 'entities' | 'dataGridKey' | 'tile'>): [DataGridState, DataGridStateMethods] => {
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
		(): DataGridState => {
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
