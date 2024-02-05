import { TableCell, TableRow } from '@contember/ui'
import { EntityAccessor, EntityId, useEntity } from '@contember/react-binding'
import { useCallback } from 'react'
import { useDataGridColumns, useDataGridHiddenColumns } from '@contember/react-datagrid'
import { DataGridColumnPublicProps } from '../types'

export type DataGridTableRowPublicProps = {
	onEntityClick?: (entity: EntityAccessor) => void
	isEntitySelected?: (entity: EntityAccessor) => boolean

	/** @deprecated use isSelected */
	selectedEntityIds?: EntityId[]
}

export type DataGridTableRowProps =
	& DataGridTableRowPublicProps

export const DataGridTableRow = ({ onEntityClick, isEntitySelected, selectedEntityIds }: DataGridTableRowProps) => {
	const entity = useEntity()
	if (selectedEntityIds !== undefined && import.meta.env.DEV) {
		console.warn(`selectedEntityIds prop on DataGrid is deprecated, use isEntitySelected callback instead.`)
	}
	const isSelected = isEntitySelected?.(entity) ?? selectedEntityIds?.includes(entity.id)

	const onClick = useCallback(() => {
		onEntityClick?.(entity)
	}, [entity, onEntityClick])
	const columns = useDataGridColumns<DataGridColumnPublicProps>()
	const hiddenColumns = useDataGridHiddenColumns()

	return (
		<TableRow onClick={onClick} active={isSelected}>
			{Array.from(columns)
				.filter(([columnKey]) => !hiddenColumns[columnKey])
				.map(([columnKey, column]) => {
					return (
						<TableCell key={columnKey} shrunk={column.shrunk} justification={column.justification}>
							{column.children}
						</TableCell>
					)
				})}
		</TableRow>
	)
}
