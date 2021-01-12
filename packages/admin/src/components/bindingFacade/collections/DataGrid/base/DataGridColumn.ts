import { BindingError, Filter, OrderBy } from '@contember/binding'
import * as React from 'react'
import { DataGridColumnKey } from './DataGridColumnKey'

export type DataGridColumnProps<F extends Filter = Filter, O extends OrderBy = OrderBy> = {
	children: React.ReactNode
	header?: React.ReactNode
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
export const DataGridColumn: <F extends Filter = Filter, O extends OrderBy = OrderBy>(
	props: DataGridColumnProps<F, O>,
) => React.ReactElement = <F extends Filter = Filter, O extends OrderBy = OrderBy>(
	props: DataGridColumnProps<F, O>,
): React.ReactElement => {
	throw new BindingError()
}
