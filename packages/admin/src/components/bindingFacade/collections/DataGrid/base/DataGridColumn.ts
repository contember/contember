import { BindingError, Environment } from '@contember/react-binding'
import type { ComponentType, ReactElement, ReactNode } from 'react'
import type { DataGridCellPublicProps } from './DataGridCellPublicProps'
import type { DataGridColumnKey } from './DataGridColumnKey'
import type { DataGridFilterArtifact } from './DataGridFilterArtifact'
import type { DataGridHeaderCellPublicProps } from './DataGridHeaderCell'
import type { DataGridOrderDirection } from './DataGridOrderDirection'
import type { DataGridSetFilter } from './DataGridSetFilter'
import type { GetNewFilter } from './GetNewFilter'
import type { GetNewOrderBy } from './GetNewOrderBy'

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

export type DataGridColumnPublicProps =
	& DataGridHeaderCellPublicProps
	& DataGridCellPublicProps
	& {
		columnKey?: string
		children?: ReactNode
	}

export type DataGridColumnProps<FA extends DataGridFilterArtifact = DataGridFilterArtifact> =
	& DataGridColumnPublicProps
	& DataGridColumnFiltering<FA>
	& DataGridColumnOrdering

export type DataGridColumns = Map<DataGridColumnKey, DataGridColumnProps>

// This is deliberately not a Contember Component!
/**
 * Constructor for custom DataGrid cell.
 *
 * @group Data grid
 */
export const DataGridColumn: <FA extends DataGridFilterArtifact = DataGridFilterArtifact>(
	props: DataGridColumnProps<FA>,
) => ReactElement = <FA extends DataGridFilterArtifact = DataGridFilterArtifact>(
	props: DataGridColumnProps<FA>,
): ReactElement => {
	throw new BindingError()
}
