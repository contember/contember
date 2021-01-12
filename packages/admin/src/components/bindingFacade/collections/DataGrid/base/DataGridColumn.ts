import { BindingError, Filter } from '@contember/binding'
import * as React from 'react'
import { DataGridColumnKey } from './DataGridColumnKey'
import { DataGridHeaderCellPublicProps } from './DataGridHeaderCell'
import { SingleColumnOrderBy } from './SingleColumnOrderBy'

export type DataGridColumnProps<
	F extends Filter = Filter,
	O extends SingleColumnOrderBy = SingleColumnOrderBy
> = DataGridHeaderCellPublicProps & {
	header?: React.ReactNode
	children: React.ReactNode
} & (
		| {
				enableFiltering?: false
		  }
		| {
				enableFiltering: true
				initialFilter: F
				filterRenderer: React.ReactElement
		  }
	) &
	(
		| {
				enableOrdering?: false
		  }
		| {
				enableOrdering: true
				initialOrder: O
		  }
	)

export type DataGridColumns = Map<DataGridColumnKey, DataGridColumnProps>

// This is deliberately not a Component!
export const DataGridColumn: <F extends Filter = Filter, O extends SingleColumnOrderBy = SingleColumnOrderBy>(
	props: DataGridColumnProps<F, O>,
) => React.ReactElement = <F extends Filter = Filter, O extends SingleColumnOrderBy = SingleColumnOrderBy>(
	props: DataGridColumnProps<F, O>,
): React.ReactElement => {
	throw new BindingError()
}
