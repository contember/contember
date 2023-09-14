import { DataGridFilterArtifact, DataGridSetFilter, GetNewFilter } from './filters'
import { DataGridOrderDirection, GetNewOrderBy } from './ordering'
import { Environment } from '@contember/react-binding'
import { ComponentType, ReactNode } from 'react'

export type DataGridColumnKey = string

export type FilterRendererProps<FA extends DataGridFilterArtifact, FilterProps extends {} = {}> =
	& {
		filter: FA
		setFilter: DataGridSetFilter<FA>
		environment: Environment
	}
	& FilterProps

export type DataGridColumnFiltering<FA extends DataGridFilterArtifact = DataGridFilterArtifact> =
	| {
		enableFiltering: false
	}
	| {
		enableFiltering?: true
		initialFilter?: FA
		getNewFilter: GetNewFilter<FA>
		emptyFilter: FA
		filterRenderer: ComponentType<FilterRendererProps<FA>>
	}

export type DataGridColumnOrdering =
	| {
		enableOrdering: false
	}
	| {
		enableOrdering?: true
		initialOrder?: DataGridOrderDirection
		getNewOrderBy: GetNewOrderBy
	}

export type DataGridColumnCommonProps = {
	columnKey?: string
	children?: ReactNode
}

export type DataGridColumnProps<FA extends DataGridFilterArtifact = DataGridFilterArtifact, P extends {} = {}> =
	& DataGridColumnCommonProps
	& DataGridColumnFiltering<FA>
	& DataGridColumnOrdering
	& P

export type DataGridColumns<P extends {}> = Map<DataGridColumnKey, DataGridColumnProps<DataGridFilterArtifact, P>>
