import * as React from 'react'
import { useComponentClassName } from '../../auxiliary'
import { Justification } from '../../types'
import cn from 'classnames'
import { toEnumViewClass, toViewClass } from '../../utils'
import { UseTableElementContext } from './Table'

export interface TableHeaderCellProps {
	children?: React.ReactNode
	justification?: Justification
	shrunk?: boolean
	scope?: 'col' | 'row'
	onClick?: React.MouseEventHandler<HTMLTableHeaderCellElement>
}

export const TableHeaderCell = React.memo(({ shrunk = false, ...props }: TableHeaderCellProps) => {
	const useTableElement = React.useContext(UseTableElementContext)
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
