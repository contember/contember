import { useMemo } from 'react'
import { DataGridState, DataGridStateMethods } from './DataGridState'
import { collectFilters } from '../grid/collectFilters'
import { collectOrderBy } from '../grid/collectOrderBy'
import { useGridPagingState } from '../paging'
import { useHiddenColumnsState } from '../grid/useHiddenColumnsState'
import { useOrderBys } from '../grid/useOrderBys'
import { useFilters } from '../grid/useFilters'
import { useDataGridKey } from './useDataGridKey'
import { extractDataGridColumns } from '../structure'
import { Filter, QueryLanguage, useEnvironment } from '@contember/binding'
import { DataGridProps } from '../grid'

export const useDataGridState = (props: Pick<DataGridProps<any>, 'children' | 'itemsPerPage' | 'entities' | 'dataGridKey'>): [DataGridState, DataGridStateMethods] => {
	const dataGridKey = useDataGridKey(props)
	const environment = useEnvironment()
	const columns = useMemo(() => extractDataGridColumns(props.children), [props.children])
	const [pageState, updatePaging] = useGridPagingState(props.itemsPerPage ?? null, dataGridKey)
	const [hiddenColumns, setIsColumnHidden] = useHiddenColumnsState(columns, dataGridKey)
	const [orderDirections, setOrderBy] = useOrderBys(columns, updatePaging, dataGridKey)
	const [filterArtifacts, setFilter] = useFilters(columns, updatePaging, dataGridKey)
	const entities = useMemo(() => QueryLanguage.desugarQualifiedEntityList({ entities: props.entities }, environment), [environment, props.entities])
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
				orderBy,
			}
		},
		[columns, filterArtifacts, environment, entities, pageState, hiddenColumns, orderDirections],
	)
	return [
		desiredState,
		useMemo(() => ({ updatePaging, setFilter, setIsColumnHidden, setOrderBy }), [updatePaging, setFilter, setIsColumnHidden, setOrderBy]),
	]
}
