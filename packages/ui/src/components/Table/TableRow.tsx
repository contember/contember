import { useClassName } from '@contember/utilities'
import { memo, ReactNode, useCallback, useContext } from 'react'
import type { Justification } from '../../types'
import { toEnumViewClass, toFeatureClass, toStateClass } from '../../utils'
import { UseTableElementContext } from './Table'

export interface TableRowProps {
	id?: string | number
	active?: boolean
	children?: ReactNode
	justification?: Justification
	onClick?: (id: number | string) => void
}

/**
 * @group UI
 */
export const TableRow = memo(({ active, children, id, justification, onClick: onClickProp }: TableRowProps) => {
	const useTableElement = useContext(UseTableElementContext)
	const className = useClassName('table-row', [
		toEnumViewClass(justification),
		toFeatureClass('hover', !!onClickProp),
		toFeatureClass('press', !!onClickProp),
		toStateClass('active', active),
	])

	const onClick = useCallback(() => {
		if (id !== undefined) {
			onClickProp?.(id)
		}
	}, [id, onClickProp])

	if (useTableElement) {
		return <tr onClick={onClick} className={className}>{children}</tr>
	}
	return <div onClick={onClick} className={className}>{children}</div>
})
TableRow.displayName = 'TableRow'
