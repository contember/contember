import { BindingError, Environment, Filter } from '@contember/binding'
import * as React from 'react'
import { DataGridColumnKey } from './DataGridColumnKey'
import { DataGridHeaderCellPublicProps } from './DataGridHeaderCell'
import { DataGridOrderDirection } from './DataGridOrderDirection'
import { DataGridSetFilter } from './DataGridSetFilter'
import { GetNewOrderBy, SingleColumnOrderBy } from './SingleColumnOrderBy'

export interface FilterRendererProps<F extends Filter = Filter> {
	filter: F | undefined
	setFilter: DataGridSetFilter<F>
	environment: Environment
}

export type DataGridColumnFiltering<F extends Filter = Filter> =
	| {
			enableFiltering: false
	  }
	| {
			enableFiltering?: true
			initialFilter?: F
			filterRenderer: React.ComponentType<FilterRendererProps<F>>
	  }

export type DataGridColumnOrdering<O extends SingleColumnOrderBy = SingleColumnOrderBy> =
	| {
			enableOrdering: false
	  }
	| {
			enableOrdering?: true
			initialOrder?: DataGridOrderDirection
			getNewOrderBy?: GetNewOrderBy
	  }

export type DataGridColumnProps<
	F extends Filter = Filter,
	O extends SingleColumnOrderBy = SingleColumnOrderBy
> = DataGridHeaderCellPublicProps & {
	header?: React.ReactNode
	children?: React.ReactNode
} & DataGridColumnFiltering<F> &
	DataGridColumnOrdering<O>

export type DataGridColumns = Map<DataGridColumnKey, DataGridColumnProps>

// This is deliberately not a Component!
export const DataGridColumn: <F extends Filter = Filter, O extends SingleColumnOrderBy = SingleColumnOrderBy>(
	props: DataGridColumnProps<F, O>,
) => React.ReactElement = <F extends Filter = Filter, O extends SingleColumnOrderBy = SingleColumnOrderBy>(
	props: DataGridColumnProps<F, O>,
): React.ReactElement => {
	throw new BindingError()
}
