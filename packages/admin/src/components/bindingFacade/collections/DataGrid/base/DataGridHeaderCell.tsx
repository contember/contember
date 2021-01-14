import { Environment } from '@contember/binding'
import { Dropdown, Icon, Justification, TableHeaderCell } from '@contember/ui'
import * as React from 'react'
import { FilterRendererProps } from './DataGridColumn'
import { DataGridFilterArtifact } from './DataGridFilterArtifact'
import { cycleOrderDirection, DataGridOrderDirection } from './DataGridOrderDirection'
import { DataGridSetFilter } from './DataGridSetFilter'
import { DataGridSetOrderBy } from './DataGridSetOrderBy'

export interface DataGridHeaderCellPublicProps {
	header?: React.ReactNode
	shrunk?: boolean
	headerJustification?: Justification
	ascOrderIcon?: React.ReactNode
	descOrderIcon?: React.ReactNode
}

export interface DataGridHeaderCellInternalProps {
	environment: Environment
	filterArtifact: DataGridFilterArtifact
	orderDirection: DataGridOrderDirection
	setFilter: DataGridSetFilter
	setOrderBy: DataGridSetOrderBy
	filterRenderer: React.ComponentType<FilterRendererProps<DataGridFilterArtifact>> | undefined
}

export interface DataGridHeaderCellProps extends DataGridHeaderCellInternalProps, DataGridHeaderCellPublicProps {}

export function DataGridHeaderCell({
	ascOrderIcon,
	descOrderIcon,
	environment,
	filterArtifact,
	filterRenderer,
	header,
	headerJustification,
	orderDirection,
	setFilter,
	setOrderBy,
	shrunk,
}: DataGridHeaderCellProps): React.ReactElement {
	return (
		<TableHeaderCell scope="col" justification={headerJustification} shrunk={shrunk}>
			<span onClick={() => setOrderBy(cycleOrderDirection(orderDirection))}>
				{header}
				&nbsp;
				{orderDirection &&
					{
						asc: ascOrderIcon ?? defaultAscIcon,
						desc: descOrderIcon ?? defaultDescIcon,
					}[orderDirection]}
			</span>
			{filterRenderer && (
				<Dropdown buttonProps={{ children: 'F' }}>
					{React.createElement(filterRenderer, {
						filter: filterArtifact,
						setFilter: setFilter,
						environment: environment,
					})}
				</Dropdown>
			)}
		</TableHeaderCell>
	)
}

const defaultAscIcon = <Icon blueprintIcon="caret-up" size="small" alignWithLowercase />
const defaultDescIcon = <Icon blueprintIcon="caret-down" size="small" alignWithLowercase />
