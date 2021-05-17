import { Environment } from '@contember/binding'
import { Box, Button, ButtonGroup, Dropdown, Icon, Table, TableCell, TableHeaderCell, TableRow } from '@contember/ui'
import { createElement, Fragment, ReactElement } from 'react'
import { MessageFormatter } from '../../../../../i18n'
import { EmptyMessage } from '../../helpers'
import { DataGridDictionary } from './dataGridDictionary'
import { DataGridSetColumnFilter } from './DataGridSetFilter'
import { DataGridState } from './DataGridState'

export interface DataGridFullFiltersPublicProps {}

export interface DataGridFullFiltersInternalProps {
	desiredState: DataGridState
	environment: Environment
	formatMessage: MessageFormatter<DataGridDictionary>
	setFilter: DataGridSetColumnFilter
}

export interface DataGridFullFiltersProps extends DataGridFullFiltersInternalProps, DataGridFullFiltersPublicProps {}

export function DataGridFullFilters({
	desiredState,
	environment,
	formatMessage,
	setFilter,
}: DataGridFullFiltersProps): ReactElement | null {
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
						{formatMessage('dataGrid.columnFiltering.showMenuButton.text')}
					</>
				),
			}}
			renderContent={({ update: updateOuterDropdown }) => (
				<Box heading={formatMessage('dataGrid.columnFiltering.heading')}>
					{hasAnyFilters || <EmptyMessage>{formatMessage('dataGrid.columnFiltering.emptyMessage.text')}</EmptyMessage>}
					{hasAnyFilters && (
						<Table
							tableHead={
								<TableRow>
									<TableHeaderCell scope="col" justification="justifyStart" shrunk>
										{formatMessage('dataGrid.columnFiltering.columnColumn.text')}
									</TableHeaderCell>
									<TableHeaderCell scope="col" justification="justifyStart">
										{formatMessage('dataGrid.columnFiltering.filterColumn.text')}
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
									return <Fragment key={key} />
								}

								return (
									<TableRow key={key}>
										<TableCell justification="justifyStart">{column.header}</TableCell>
										<TableCell>
											{createElement(filterRenderer, {
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
										{formatMessage('dataGrid.columnFiltering.addFilterButton.text')}
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
