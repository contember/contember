import { Box, Button, ButtonGroup, Dropdown, DropdownProps, Table, TableCell, TableHeaderCell, TableRow, Text } from '@contember/ui'
import { createElement, Fragment, ReactElement, useMemo } from 'react'
import { dataGridDictionary } from '../dict/dataGridDictionary'
import { useEnvironment } from '@contember/react-binding'
import { useMessageFormatter } from '@contember/react-i18n'
import { EmptyMessage } from '@contember/react-binding-ui'
import { FilterIcon, PlusCircleIcon, Trash2Icon } from 'lucide-react'
import { useDataViewFilteringMethods, useDataViewFilteringState } from '@contember/react-dataview'
import { useDataGridColumns } from '@contember/react-datagrid'
import { DataGridColumnPublicProps } from '../types'

export type DataGridFullFiltersPublicProps = {
	allowAggregateFilterControls?: boolean
}

export type DataGridFullFiltersProps =
	& DataGridFullFiltersPublicProps

export function DataGridFullFilters({
	allowAggregateFilterControls,
}: DataGridFullFiltersProps): ReactElement | null {
	const formatMessage = useMessageFormatter(dataGridDictionary)
	const environment = useEnvironment()
	const { setFilter } = useDataViewFilteringMethods()
	const columns = useDataGridColumns<DataGridColumnPublicProps>()
	const filteringArtifact = useDataViewFilteringState().artifact

	const remainingColumns = Array.from(columns).filter(
		([key, column]) => column.enableFiltering !== false && !(key in filteringArtifact),
	)

	const hasAnyFilters = Object.keys(filteringArtifact).length > 0

	const columnFilteringButtonProps: DropdownProps['buttonProps'] = useMemo(() => ({
		intent: hasAnyFilters ? undefined : 'default',
		distinction: 'seamless',
		children: (
			<>
				<FilterIcon fill={hasAnyFilters ? 'currentColor' : 'none'} />
				<Text translate={formatMessage}>dataGrid.columnFiltering.showMenuButton.text</Text>
			</>
		),
		size: 'small',
	}), [formatMessage, hasAnyFilters])

	const filterButtonProps: DropdownProps['buttonProps'] = useMemo(() => ({
		distinction: 'seamless',
		display: 'block',
		children: (
			<>
				<PlusCircleIcon />
				{formatMessage('dataGrid.columnFiltering.addFilterButton.text')}
			</>
		),
	}), [formatMessage])

	if (allowAggregateFilterControls === false) {
		return null
	}

	return (
		<Dropdown
			alignment="center"
			buttonProps={columnFilteringButtonProps}
			renderContent={({ update: updateOuterDropdown }) => (
				<Box label={<Text translate={formatMessage}>dataGrid.columnFiltering.heading</Text>}>
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
							{Array.from(Object.entries(filteringArtifact), ([key, filterArtifact]) => {
								const column = columns.get(key)!
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
											>
												<Trash2Icon />
											</Button>
										</TableCell>
									</TableRow>
								)
							})}
						</Table>
					)}
					{!!remainingColumns.length && (
						<Dropdown buttonProps={filterButtonProps}>
							{({ requestClose }) => (
								<ButtonGroup direction="vertical" display="block" inset="border">
									{remainingColumns.map(([key, column]) => (
										<Button
											key={key}
											justify="start"
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
