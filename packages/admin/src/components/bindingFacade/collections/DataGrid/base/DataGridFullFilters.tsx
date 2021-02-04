import { Environment } from '@contember/binding'
import { Box, Button, ButtonGroup, Dropdown, Icon, Table, TableCell, TableHeaderCell, TableRow } from '@contember/ui'
import * as React from 'react'
import { EmptyMessage } from '../../helpers'
import { DataGridSetColumnFilter } from './DataGridSetFilter'
import { DataGridSetIsColumnHidden } from './DataGridSetIsColumnHidden'
import { DataGridSetColumnOrderBy } from './DataGridSetOrderBy'
import { DataGridState } from './DataGridState'

export interface DataGridFullFiltersPublicProps {}

export interface DataGridFullFiltersInternalProps {
	desiredState: DataGridState
	environment: Environment
	setFilter: DataGridSetColumnFilter
}

export interface DataGridFullFiltersProps extends DataGridFullFiltersInternalProps, DataGridFullFiltersPublicProps {}

export function DataGridFullFilters({
	desiredState,
	environment,
	setFilter,
}: DataGridFullFiltersProps): React.ReactElement | null {
	const remainingColumns = Array.from(desiredState.columns).filter(
		([key, column]) => column.enableFiltering !== false && !desiredState.filterArtifacts.has(key),
	)

	const hasAnyFilters = desiredState.filterArtifacts.size > 0

	return (
		<Dropdown
			alignment="end"
			buttonProps={{
				intent: hasAnyFilters ? 'primary' : 'default',
				distinction: 'seamless',
				children: (
					<>
						<Icon
							blueprintIcon="filter"
							alignWithLowercase
							style={{
								marginRight: '0.2em',
								opacity: hasAnyFilters ? '1' : '0.8',
							}}
						/>
						All filters
					</>
				),
			}}
			renderContent={({ update: updateOuterDropdown }) => (
				<Box heading="All filters">
					{hasAnyFilters || <EmptyMessage>There are no active filters.</EmptyMessage>}
					{hasAnyFilters && (
						<Table
							tableHead={
								<TableRow>
									<TableHeaderCell scope="col" justification="justifyStart" shrunk>
										Column
									</TableHeaderCell>
									<TableHeaderCell scope="col" justification="justifyStart">
										Filter
									</TableHeaderCell>
									<TableHeaderCell scope="col" shrunk>
										&nbsp;
									</TableHeaderCell>
								</TableRow>
							}
						>
							{Array.from(desiredState.filterArtifacts, ([key, filterArtifact]) => {
								const column = desiredState.columns.get(key)!
								const filterRenderer = column.enableFiltering !== false ? column.filterRenderer : undefined

								if (!filterRenderer) {
									return <React.Fragment key={key} />
								}

								return (
									<TableRow key={key}>
										<TableCell justification="justifyStart">{column.header}</TableCell>
										<TableCell>
											{React.createElement(filterRenderer, {
												filter: filterArtifact,
												setFilter: newArtifact => setFilter(key, newArtifact),
												environment: environment,
											})}
										</TableCell>
										<TableCell shrunk justification="justifyEnd">
											<Button
												onClick={() => {
													updateOuterDropdown()
													setFilter(key, undefined)
												}}
												distinction="seamless"
												size="small"
												bland
											>
												<Icon blueprintIcon="trash" size="small" />
											</Button>
										</TableCell>
									</TableRow>
								)
							})}
						</Table>
					)}
					{!!remainingColumns.length && (
						<Dropdown
							alignment="center"
							buttonProps={{
								distinction: 'seamless',
								flow: 'block',
								style: { marginTop: hasAnyFilters ? '1em' : 0 },
								children: (
									<>
										<Icon alignWithLowercase blueprintIcon="add" style={{ marginRight: '0.2em' }} />
										Add a column filter
									</>
								),
							}}
						>
							{({ requestClose }) => (
								<ButtonGroup orientation="vertical">
									{remainingColumns.map(([key, column]) => (
										<Button
											key={key}
											distinction="seamless"
											flow="generousBlock"
											justification="justifyStart"
											onClick={() => {
												requestClose()
												updateOuterDropdown()

												if (column.enableFiltering === false) {
													return
												}

												setFilter(key, column.emptyFilter)
											}}
										>
											{column.header}
										</Button>
									))}
								</ButtonGroup>
							)}
						</Dropdown>
					)}
				</Box>
			)}
		/>
	)
}
