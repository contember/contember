import { Environment } from '@contember/binding'
import { ActionableBox, Box, Dropdown, Icon, Justification, TableHeaderCell } from '@contember/ui'
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
	hasFilter: boolean
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
	hasFilter,
	header,
	headerJustification,
	orderDirection,
	setFilter,
	setOrderBy,
	shrunk,
}: DataGridHeaderCellProps): React.ReactElement {
	return (
		<TableHeaderCell scope="col" justification={headerJustification} shrunk={shrunk}>
			<span style={{ display: 'flex', justifyContent: 'flex-start', gap: '.25em' }}>
				<span onClick={() => setOrderBy(cycleOrderDirection(orderDirection))} style={{ cursor: 'pointer' }}>
					{header}
					&nbsp;
					{orderDirection &&
						{
							asc: ascOrderIcon ?? defaultAscIcon,
							desc: descOrderIcon ?? defaultDescIcon,
						}[orderDirection]}
				</span>
				{filterRenderer && (
					<Dropdown
						buttonProps={{
							intent: hasFilter ? 'primary' : 'default',
							distinction: 'seamless',
							size: 'small',
							children: (
								<Icon
									blueprintIcon="filter"
									alignWithLowercase
									style={{
										opacity: hasFilter ? '1' : '0.5',
									}}
								/>
							),
						}}
						renderContent={({ requestClose }) => (
							<ActionableBox
								onRemove={() => {
									setFilter(undefined)
									requestClose()
								}}
							>
								<Box heading="Filter">
									{React.createElement(filterRenderer, {
										filter: filterArtifact,
										setFilter: setFilter,
										environment: environment,
									})}
								</Box>
							</ActionableBox>
						)}
					/>
				)}
			</span>
		</TableHeaderCell>
	)
}

const defaultAscIcon = <Icon blueprintIcon="caret-up" size="small" alignWithLowercase />
const defaultDescIcon = <Icon blueprintIcon="caret-down" size="small" alignWithLowercase />
