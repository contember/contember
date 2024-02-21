import { useEnvironment } from '@contember/react-binding'
import { useMemo, useState } from 'react'
import { DataGridProps } from '../grid'
import { DataGridColumns, DataGridMethods, DataGridState } from '../types'
import { extractDataGridColumns } from './gridTemplateAnalyzer'
import { DataViewFilteringArtifacts, DataViewInfo, DataViewSelectionValues, useDataView } from '@contember/react-dataview'
import { getInitialSorting } from './sorting'
import { getFilterTypes, normalizeInitialFilters } from './filters'
import { normalizeInitialHiddenColumnsState } from './hiding'


export const useDataGridState = (props: Pick<DataGridProps<{ tile?: unknown }>, 'children' | 'itemsPerPage' | 'entities' | 'dataGridKey' | 'tile'>): {
	state: DataGridState
	methods: DataGridMethods
	info: DataViewInfo
	columns: DataGridColumns<any>
} => {
	const environment = useEnvironment()
	const columns = useMemo(() => extractDataGridColumns(props.children, environment), [environment, props.children])
	const [initialSorting] = useState(() => getInitialSorting(columns))
	const [initialFilters] = useState(() => (stored: DataViewFilteringArtifacts) => normalizeInitialFilters(stored, columns))

	const [initialSelection] = useState(() => (stored: DataViewSelectionValues) => ({
		...normalizeInitialHiddenColumnsState(stored, columns),
		layout: stored?.layout ?? (props.tile ? 'tiles' : 'default'),
	}))

	const {
		state,
		methods,
		info,
	} = useDataView({

		dataViewKey: props.dataGridKey,
		entities: props.entities,
		filterTypes: useMemo(() => {
			return getFilterTypes(columns)
		}, [columns]),
		initialFilters: initialFilters,
		initialItemsPerPage: props.itemsPerPage,
		initialSorting,
		initialSelection,
	})

	return {
		state,
		columns,
		methods,
		info,
	}
}
