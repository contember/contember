import { useClassName } from '@contember/react-utils'
import { memo, MouseEventHandler, ReactNode, useContext } from 'react'
import type { Justification } from '../../types'
import { toEnumViewClass, toFeatureClass, toStateClass } from '../../utils'
import { UseTableElementContext } from './Table'

export interface TableRowProps {
	active?: boolean
	children?: ReactNode
	justification?: Justification
	onClick?: MouseEventHandler<HTMLTableRowElement>
}

/**
 * @group UI
 */
export const TableRow = memo(({ active, children, justification, onClick: onClick }: TableRowProps) => {
	const useTableElement = useContext(UseTableElementContext)
	const className = useClassName('table-row', [
		toEnumViewClass(justification),
		toFeatureClass('hover', !!onClick),
		toFeatureClass('press', !!onClick),
		toStateClass('active', active),
	])

	if (useTableElement) {
		return <tr onClick={onClick} className={className}>{children}</tr>
	}
	return <div onClick={onClick} className={className}>{children}</div>
})
TableRow.displayName = 'TableRow'
