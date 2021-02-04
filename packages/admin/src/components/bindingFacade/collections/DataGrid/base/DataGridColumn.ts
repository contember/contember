import { BindingError, Environment } from '@contember/binding'
import * as React from 'react'
import { DataGridColumnKey } from './DataGridColumnKey'
import { DataGridCellPublicProps } from './DataGridContainer'
import { DataGridFilterArtifact } from './DataGridFilterArtifact'
import { DataGridHeaderCellPublicProps } from './DataGridHeaderCell'
import { DataGridOrderDirection } from './DataGridOrderDirection'
import { DataGridSetFilter } from './DataGridSetFilter'
import { GetNewFilter } from './GetNewFilter'
import { GetNewOrderBy } from './GetNewOrderBy'

export interface FilterRendererProps<FA extends DataGridFilterArtifact> {
	filter: FA
	setFilter: DataGridSetFilter<FA>
	environment: Environment
}

export type DataGridColumnFiltering<FA extends DataGridFilterArtifact = DataGridFilterArtifact> =
	| {
			enableFiltering: false
	  }
	| {
			enableFiltering?: true
			initialFilter?: FA
			getNewFilter: GetNewFilter<FA>
			emptyFilter: FA
			filterRenderer: React.ComponentType<FilterRendererProps<FA>>
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

export type DataGridColumnProps<
	FA extends DataGridFilterArtifact = DataGridFilterArtifact
> = DataGridHeaderCellPublicProps &
	DataGridCellPublicProps &
	DataGridColumnFiltering<FA> &
	DataGridColumnOrdering & {
		children: React.ReactNode
	}

export type DataGridColumns = Map<DataGridColumnKey, DataGridColumnProps>

// This is deliberately not a Component!
export const DataGridColumn: <FA extends DataGridFilterArtifact = DataGridFilterArtifact>(
	props: DataGridColumnProps<FA>,
) => React.ReactElement = <FA extends DataGridFilterArtifact = DataGridFilterArtifact>(
	props: DataGridColumnProps<FA>,
): React.ReactElement => {
	throw new BindingError()
}
