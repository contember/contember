import { EntityListSubTree } from '@contember/binding'
import * as React from 'react'
import { collectFilters } from './collectFilters'
import { collectOrderBys } from './collectOrderBys'
import { DataGridState } from './DataGridState'

export const renderGrid = (
	entityName: string,
	{ paging: { pageIndex, itemsPerPage }, filters, orderBys, columns }: DataGridState,
): React.ReactElement => {
	return (
		<EntityListSubTree
			entities={{
				entityName,
				filter: collectFilters(filters),
			}}
			offset={itemsPerPage === null ? undefined : itemsPerPage * pageIndex}
			limit={itemsPerPage === null ? undefined : itemsPerPage}
			orderBy={collectOrderBys(orderBys)}
		>
			{Array.from(columns, ([key, props]) => (
				<React.Fragment key={key}>
					{props.header}
					{props.children}
				</React.Fragment>
			))}
		</EntityListSubTree>
	)
}
