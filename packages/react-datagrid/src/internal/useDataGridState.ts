import { useEnvironment } from '@contember/react-binding'
import { useSessionStorageState } from '@contember/react-utils'
import { useMemo, useState } from 'react'
import { DataGridProps } from '../grid'
import { useHiddenColumnsState } from './useHiddenColumnsState'
import { DataGridLayout, DataGridMethods, DataGridState } from '../types'
import { extractDataGridColumns } from './gridTemplateAnalyzer'
import { DataViewFilteringArtifacts, DataViewInfo, useDataView } from '@contember/react-dataview'
import { getInitialSorting } from './getInitialSorting'
import { normalizeInitialFilters } from './normalizeInitialFilters'
import { getFilterTypes } from './getFilterTypes'


export const useDataGridState = (props: Pick<DataGridProps<{ tile?: unknown }>, 'children' | 'itemsPerPage' | 'entities' | 'dataGridKey' | 'tile'>): {
	state: DataGridState<any>
	methods: DataGridMethods
	info: DataViewInfo
} => {
	const environment = useEnvironment()
	const columns = useMemo(() => extractDataGridColumns(props.children, environment), [environment, props.children])
	const [initialSorting] = useState(() => getInitialSorting(columns))
	const [initialFilters] = useState(() => (stored: DataViewFilteringArtifacts) => normalizeInitialFilters(stored, columns))
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
		initialSorting: initialSorting,
	})
	const [hiddenColumns, setIsColumnHidden] = useHiddenColumnsState(columns, state.key)
	const [layout, setLayout] = useSessionStorageState<DataGridLayout>(`${state.key}-layout`, layout => layout ?? (props.tile ? 'tiles' : 'default'))


	const desiredState = useMemo(
		(): DataGridState<any> => {
			return {
				...state,
				columns,
				hiddenColumns,
				layout: {
					view: layout,
				},
			}
		},
		[state, columns, hiddenColumns, layout],
	)
	const dataGridMethods = useMemo(
		(): DataGridMethods => ({
			...methods,
			hiding: {
				setIsColumnHidden,
			},
			layout: {
				setView: setLayout,
			},
		}),
		[methods, setIsColumnHidden, setLayout],
	)

	return {
		state: desiredState,
		methods: dataGridMethods,
		info,
	}
}
