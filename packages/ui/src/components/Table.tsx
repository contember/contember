import * as React from 'react'
import { Box } from './Box'
import cn from 'classnames'
import { Justification } from '../types'
import { toEnumViewClass, toViewClass } from '../utils'

const UseTableElementContext = React.createContext(true)

export interface TableProps {
	children?: React.ReactNode
	heading?: React.ReactNode
	compact?: boolean
	justification?: Justification
	useTableElement?: boolean
}
export const Table = React.memo(({ useTableElement = true, compact = false, ...props }: TableProps) => {
	const className = cn('table', compact && 'view-compact', toEnumViewClass(props.justification, 'justifyStart'))

	return (
		<UseTableElementContext.Provider value={useTableElement}>
			<Box heading={props.heading}>
				{useTableElement ? (
					<table className={className}>
						<tbody>{props.children}</tbody>
					</table>
				) : (
					<div className={className}>{props.children}</div>
				)}
			</Box>
		</UseTableElementContext.Provider>
	)
})
Table.displayName = 'Table'

export interface TableRowProps {
	children?: React.ReactNode
	justification?: Justification
}
export const TableRow = React.memo((props: TableRowProps) => {
	const useTableElement = React.useContext(UseTableElementContext)
	const className = cn('table-row', toEnumViewClass(props.justification))

	if (useTableElement) {
		return <tr className={className}>{props.children}</tr>
	}
	return <div className={className}>{props.children}</div>
})
TableRow.displayName = 'TableRow'

export interface TableCellProps {
	children?: React.ReactNode
	justification?: Justification
	shrink?: boolean
}
export const TableCell = React.memo(({ shrink = false, ...props }: TableCellProps) => {
	const useTableElement = React.useContext(UseTableElementContext)
	const className = cn('table-cell', toEnumViewClass(props.justification), toViewClass('shrink', shrink))

	if (useTableElement) {
		return <td className={className}>{props.children}</td>
	}
	return <div className={className}>{props.children}</div>
})
TableCell.displayName = 'TableCell'
