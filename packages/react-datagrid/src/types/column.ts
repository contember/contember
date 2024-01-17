import { Environment } from '@contember/react-binding'
import { DataViewFilterArtifact, DataViewFilterHandler, DataViewOrderDirection, DataViewSetFilter } from '@contember/react-dataview'
import { ComponentType, ReactNode } from 'react'
import { DataGridHidingState } from './hiding'

export type DataGridColumnKey = string

export type FilterRendererProps<FA extends DataViewFilterArtifact, FilterProps extends {} = {}> =
	& {
		filter: FA
		setFilter: DataViewSetFilter<FA>
		environment: Environment
	}
	& FilterProps

export type DataGridColumnFiltering<FA extends DataViewFilterArtifact = DataViewFilterArtifact> =
	| {
		enableFiltering: false
	}
	| {
		enableFiltering?: true
		initialFilter?: FA
		getNewFilter: DataViewFilterHandler<FA>
		emptyFilter: FA
		filterRenderer: ComponentType<FilterRendererProps<FA>>
	}

export type DataGridColumnOrdering =
	| {
		enableOrdering: false
	}
	| {
		enableOrdering?: true
		initialOrder?: DataViewOrderDirection
	}

export type DataGridColumnCommonProps = {
	columnKey?: string
	children?: ReactNode
}

export type DataGridColumnProps<FA extends DataViewFilterArtifact = DataViewFilterArtifact, P extends {} = {}> =
	& DataGridColumnCommonProps
	& DataGridColumnFiltering<FA>
	& DataGridColumnOrdering
	& P

export type DataGridColumns<P extends {}> = Map<DataGridColumnKey, DataGridColumnProps<DataViewFilterArtifact, P>>
