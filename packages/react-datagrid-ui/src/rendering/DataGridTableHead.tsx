import { DataGridHeaderCell } from './DataGridHeaderCell'
import { DataGridRenderingCommonProps } from '../types'
import { TableRow } from '@contember/ui'

export type DataGridTableHead =
	& DataGridRenderingCommonProps

export const DataGridTableHead = (props: DataGridTableHead) => {
	const { desiredState: { columns, hiddenColumns } } = props
	return (
		<TableRow>
			{Array.from(columns)
				// We use desired state here to give immediate feedback about column changes.
				.filter(([columnKey]) => !hiddenColumns[columnKey])
				.map(([columnKey, column]) => {
					return (
						<DataGridHeaderCell
							key={columnKey}
							columnKey={columnKey}
							column={column}
							{...props}
						/>
					)
				})}
		</TableRow>
	)
}
