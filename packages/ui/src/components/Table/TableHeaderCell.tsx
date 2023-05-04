import cn from 'classnames'
import { memo, MouseEventHandler, ReactNode, useContext } from 'react'
import { useComponentClassName } from '../../auxiliary'
import type { Justification } from '../../types'
import { toEnumViewClass, toViewClass } from '../../utils'
import { UseTableElementContext } from './Table'

export interface TableHeaderCellProps {
	children?: ReactNode
	justification?: Justification
	shrunk?: boolean
	scope?: 'col' | 'row'
	onClick?: MouseEventHandler<HTMLTableHeaderCellElement>
}

/**
 * @group UI
 */
export const TableHeaderCell = memo(({ shrunk = false, ...props }: TableHeaderCellProps) => {
	const useTableElement = useContext(UseTableElementContext)
	const className = cn(
		useComponentClassName('table-cell'),
		toEnumViewClass(props.justification),
		toViewClass('shrunk', shrunk),
	)

	if (useTableElement) {
		return (
			<th scope={props.scope} className={className} onClick={props.onClick}>
				{props.children}
			</th>
		)
	}
	return <div className={className}>{props.children}</div>
})
TableHeaderCell.displayName = 'TableHeaderCell'
