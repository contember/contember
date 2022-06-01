import { Entity } from '@contember/binding'
import { Table, TableCell, TableRow } from '@contember/ui'
import { memo } from 'react'
import { useMessageFormatter } from '../../../../../../i18n'
import { EmptyMessage } from '../../../helpers'
import { dataGridDictionary } from '../dataGridDictionary'
import { DataGridHeaderCell } from '../DataGridHeaderCell'
import { getColumnFilter } from '../getColumnFilter'
import type { DataGridContainerProps } from './Types'

interface DataGridContainerTableProps
	extends Pick<
		DataGridContainerProps,
		| 'accessor'
		| 'desiredState'
		| 'emptyMessage'
		| 'emptyMessageComponent'
		| 'displayedState'
		| 'setFilter'
		| 'setOrderBy'
	> {}

export const DataGridContainerTable = memo<DataGridContainerTableProps>(({
	accessor,
	desiredState,
	displayedState,
	emptyMessage,
	emptyMessageComponent,
	setFilter,
	setOrderBy,
}) => {
	const {
		filterArtifacts,
		orderDirections,
		columns,
	} = desiredState

	const formatMessage = useMessageFormatter(dataGridDictionary)

	return (
		<Table
			tableHead={
				<TableRow>
					{Array.from(columns)
						// We use desired state here to give immediate feedback about column changes.
						.filter(([columnKey]) => !desiredState.hiddenColumns[columnKey])
						.map(([columnKey, column]) => {
							const filterArtifact = filterArtifacts[columnKey]
							const orderDirection = orderDirections[columnKey]
							const orderColumns = Object.keys(orderDirections)
							return (
								<DataGridHeaderCell
									key={columnKey}
									environment={accessor.environment}
									filterArtifact={filterArtifact}
									emptyFilterArtifact={column.enableFiltering !== false ? column.emptyFilter : null}
									orderState={orderDirection ? {
										direction: orderDirection,
										index: orderColumns.length > 1 ? orderColumns.indexOf(columnKey) : undefined,
									} : undefined}
									setFilter={newFilter => setFilter(columnKey, newFilter)}
									setOrderBy={(newOrderBy, append = false) => setOrderBy(columnKey, newOrderBy, append)}
									headerJustification={column.headerJustification || column.justification}
									shrunk={column.shrunk}
									hasFilter={getColumnFilter(column, filterArtifact, accessor.environment) !== undefined}
									header={column.header}
									ascOrderIcon={column.ascOrderIcon}
									descOrderIcon={column.descOrderIcon}
									filterRenderer={column.enableFiltering !== false ? column.filterRenderer : undefined}
								/>
							)
						})}
				</TableRow>
			}
		>
			{!!accessor.length &&
				Array.from(accessor, entity => (
					<Entity
						key={entity.id ?? entity.key}
						accessor={entity}
					>
						<TableRow>
							{Array.from(columns)
								.filter(([columnKey]) => !desiredState.hiddenColumns[columnKey])
								.map(([columnKey, column]) => {
									// This is tricky. We need to render a table cell from here no matter what so that the cell count
									// matches that of the headers. However, there might be a header displayed for a column whose data
									// has not yet been fetched. Displaying its cell contents from here would cause an error. Also, the
									// column may have just been hidden but the information hasn't made it to displayed sate yet.
									// For these, we just display an empty cell then.
									if (displayedState.hiddenColumns[columnKey]) {
										return <TableCell key={columnKey} shrunk />
									}
									return (
										<TableCell key={columnKey} shrunk={column.shrunk} justification={column.justification}>
											{column.children}
										</TableCell>
									)
								})}
						</TableRow>
					</Entity>
				))}
			{!accessor.length && (
				<TableRow>
					<TableCell colSpan={columns.size}>
						<EmptyMessage
							distinction="seamless"
							component={emptyMessageComponent}
						>
							{formatMessage(emptyMessage, 'dataGrid.emptyMessage.text')}
						</EmptyMessage>
					</TableCell>
				</TableRow>
			)}
		</Table>
	)
})
