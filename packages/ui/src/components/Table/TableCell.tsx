import { useClassName } from '@contember/utilities'
import { memo, ReactNode, useContext } from 'react'
import type { Alignment, Justification } from '../../types'
import { toEnumViewClass, toViewClass } from '../../utils'
import { UseTableElementContext } from './Table'

export interface TableCellProps {
	children?: ReactNode
	alignment?: Alignment
	justification?: Justification
	shrunk?: boolean
	numeric?: boolean
	colSpan?: number
}

/**
 * @group UI
 */
export const TableCell = memo(({ shrunk = false, numeric = false, ...props }: TableCellProps) => {
	const useTableElement = useContext(UseTableElementContext)

	const className = useClassName('table-cell', [
		toEnumViewClass(props.alignment),
		toEnumViewClass(props.justification),
		toViewClass('numeric', numeric),
		toViewClass('shrunk', shrunk),
	])

	if (useTableElement) {
		return (
			<td className={className} colSpan={props.colSpan}>
				{props.children}
			</td>
		)
	}
	return <div className={className}>{props.children}</div>
})
TableCell.displayName = 'TableCell'
