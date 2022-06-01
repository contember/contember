import type { Environment } from '@contember/binding'
import { ActionableBox, Box, Dropdown, DropdownProps, Icon, Justification, TableHeaderCell } from '@contember/ui'
import { ComponentType, createElement, ReactElement, ReactNode, useMemo } from 'react'
import type { FilterRendererProps } from './DataGridColumn'
import type { DataGridFilterArtifact } from './DataGridFilterArtifact'
import { cycleOrderDirection, DataGridOrderDirection } from './DataGridOrderDirection'
import type { DataGridSetFilter } from './DataGridSetFilter'
import type { DataGridSetOrderBy } from './DataGridSetOrderBy'

export interface DataGridHeaderCellPublicProps {
	header?: ReactNode
	shrunk?: boolean
	headerJustification?: Justification
	ascOrderIcon?: ReactNode
	descOrderIcon?: ReactNode
}

export interface DataGridHeaderCellInternalProps {
	environment: Environment
	hasFilter: boolean
	emptyFilterArtifact: DataGridFilterArtifact
	filterArtifact: DataGridFilterArtifact
	orderState: { direction: Exclude<DataGridOrderDirection, null>, index: number | undefined } | undefined
	setFilter: DataGridSetFilter
	setOrderBy: DataGridSetOrderBy
	filterRenderer: ComponentType<FilterRendererProps<DataGridFilterArtifact>> | undefined
}

export interface DataGridHeaderCellProps extends DataGridHeaderCellInternalProps, DataGridHeaderCellPublicProps {}

export function DataGridHeaderCell({
	ascOrderIcon,
	descOrderIcon,
	emptyFilterArtifact,
	environment,
	filterArtifact,
	filterRenderer,
	hasFilter,
	header,
	headerJustification,
	orderState,
	setFilter,
	setOrderBy,
	shrunk,
}: DataGridHeaderCellProps): ReactElement {
	const buttonProps: DropdownProps['buttonProps'] = useMemo(() => ({
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
	}), [hasFilter])

	return (
		<TableHeaderCell scope="col" justification={headerJustification} shrunk={shrunk}>
			<span style={{ display: 'flex', justifyContent: 'flex-start', gap: '.25em' }}>
				<span onClick={e => setOrderBy(cycleOrderDirection(orderState?.direction ?? null), e.ctrlKey || e.metaKey)} style={{ cursor: 'pointer' }}>
					{header}
					&nbsp;
					{orderState &&
						<>
							{{
								asc: ascOrderIcon ?? defaultAscIcon,
								desc: descOrderIcon ?? defaultDescIcon,
							}[orderState.direction]}
							{orderState.index !== undefined ? `(${orderState.index + 1})` : null}
						</>}
				</span>
				{filterRenderer && (
					<Dropdown
						buttonProps={buttonProps}
						renderContent={({ requestClose }) => (
							<ActionableBox
								onRemove={() => {
									setFilter(undefined)
									requestClose()
								}}
							>
								<Box heading={<>Filter: {header}</>}>
									{createElement(filterRenderer, {
										filter: filterArtifact === undefined ? emptyFilterArtifact : filterArtifact,
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
