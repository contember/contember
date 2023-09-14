import { TableCell, TableRow } from '@contember/ui'
import { EntityAccessor, EntityId, useEntity } from '@contember/react-binding'
import { DataGridRenderingCommonProps } from '../types'
import { useCallback } from 'react'

export type DataGridTableRowPublicProps = {
	onEntityClick?: (entity: EntityAccessor) => void
	isEntitySelected?: (entity: EntityAccessor) => boolean

	/** @deprecated use isSelected */
	selectedEntityIds?: EntityId[]
}

export type DataGridTableRowProps =
	& DataGridRenderingCommonProps
	& DataGridTableRowPublicProps

export const DataGridTableRow = ({ desiredState, displayedState, onEntityClick, isEntitySelected, selectedEntityIds }: DataGridTableRowProps) => {
	const entity = useEntity()
	if (selectedEntityIds !== undefined && import.meta.env.DEV) {
		console.warn(`selectedEntityIds prop on DataGrid is deprecated, use isEntitySelected callback instead.`)
	}
	const isSelected = isEntitySelected?.(entity) ?? selectedEntityIds?.includes(entity.id)

	const onClick = useCallback(() => {
		onEntityClick?.(entity)
	}, [entity, onEntityClick])

	return (
		<TableRow onClick={onClick} active={isSelected}>
			{Array.from(desiredState.columns)
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
	)
}
