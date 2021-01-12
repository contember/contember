import { CrudQueryBuilder } from '@contember/client'
import { Button, Icon } from '@contember/ui'
import * as React from 'react'
import { DataGridSetOrderBy } from './DataGridSetOrderBy'
import { SingleColumnOrderBy } from './SingleColumnOrderBy'

export interface DataGridHeaderCellPublicProps {
	children: React.ReactNode

	ascOrderIcon?: React.ReactNode
	descOrderIcon?: React.ReactNode
}

export interface DataGridHeaderCellInternalProps {
	orderBy: SingleColumnOrderBy | undefined
	orderDirection: CrudQueryBuilder.OrderDirection | undefined
	setOrderBy: DataGridSetOrderBy
}

export interface DataGridHeaderCellProps extends DataGridHeaderCellInternalProps, DataGridHeaderCellPublicProps {}

export function DataGridHeaderCell(props: DataGridHeaderCellProps): React.ReactElement {
	return (
		<th scope="col">
			<Button distinction="seamless" flow="block" intent="dark" onClick={() => props.setOrderBy()}>
				{props.children}
				&nbsp;
				{props.orderDirection &&
					{
						asc: props.ascOrderIcon ?? defaultAscIcon,
						desc: props.descOrderIcon ?? defaultDescIcon,
					}[props.orderDirection.value]}
			</Button>
		</th>
	)
}

const defaultAscIcon = <Icon blueprintIcon="sort-asc" size="small" />
const defaultDescIcon = <Icon blueprintIcon="sort-desc" size="small" />
