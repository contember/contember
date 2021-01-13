import { Environment, Filter } from '@contember/binding'
import { Dropdown, Icon, TableHeaderCell } from '@contember/ui'
import * as React from 'react'
import { FilterRendererProps } from './DataGridColumn'
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
	environment: Environment
	filter: Filter | undefined
	orderBy: SingleColumnOrderBy | undefined
	orderDirection: DataGridOrderDirection
	setFilter: DataGridSetFilter
	setOrderBy: DataGridSetOrderBy
	filterRenderer: React.ComponentType<FilterRendererProps<Filter>> | undefined
}

export interface DataGridHeaderCellProps extends DataGridHeaderCellInternalProps, DataGridHeaderCellPublicProps {}

export function DataGridHeaderCell(props: DataGridHeaderCellProps): React.ReactElement {
	return (
		<TableHeaderCell scope="col">
			<span onClick={() => props.setOrderBy(toggleOrderDirection(props.orderDirection))}>
				{props.children}
				&nbsp;
				{props.orderDirection &&
					{
						asc: props.ascOrderIcon ?? defaultAscIcon,
						desc: props.descOrderIcon ?? defaultDescIcon,
					}[props.orderDirection]}
			</span>
			{props.filterRenderer && (
				<Dropdown buttonProps={{ children: 'F' }}>
					{React.createElement(props.filterRenderer, {
						filter: props.filter,
						setFilter: props.setFilter,
						environment: props.environment,
					})}
				</Dropdown>
			)}
		</TableHeaderCell>
	)
}

const defaultAscIcon = <Icon blueprintIcon="caret-up" size="small" alignWithLowercase />
const defaultDescIcon = <Icon blueprintIcon="caret-down" size="small" alignWithLowercase />
