import { Filter } from '@contember/binding'
import { Icon, TableHeaderCell } from '@contember/ui'
import * as React from 'react'
import { DataGridOrderDirection, toggleOrderDirection } from './DataGridOrderDirection'
import { DataGridSetFilter } from './DataGridSetFilter'
import { DataGridSetOrderBy } from './DataGridSetOrderBy'
import { SingleColumnOrderBy } from './SingleColumnOrderBy'

export interface DataGridHeaderCellPublicProps {
	children: React.ReactNode

	ascOrderIcon?: React.ReactNode
	descOrderIcon?: React.ReactNode
}

export interface DataGridHeaderCellInternalProps {
	filter: Filter | undefined
	orderBy: SingleColumnOrderBy | undefined
	orderDirection: DataGridOrderDirection
	setFilter: DataGridSetFilter
	setOrderBy: DataGridSetOrderBy
}

export interface DataGridHeaderCellProps extends DataGridHeaderCellInternalProps, DataGridHeaderCellPublicProps {}

export function DataGridHeaderCell(props: DataGridHeaderCellProps): React.ReactElement {
	return (
		<TableHeaderCell scope="col" onClick={() => props.setOrderBy(toggleOrderDirection(props.orderDirection))}>
			{props.children}
			&nbsp;
			{props.orderDirection &&
				{
					asc: props.ascOrderIcon ?? defaultAscIcon,
					desc: props.descOrderIcon ?? defaultDescIcon,
				}[props.orderDirection]}
		</TableHeaderCell>
	)
}

const defaultAscIcon = <Icon blueprintIcon="caret-up" size="small" alignWithLowercase />
const defaultDescIcon = <Icon blueprintIcon="caret-down" size="small" alignWithLowercase />
