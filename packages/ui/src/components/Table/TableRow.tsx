import classNames from 'classnames'
import { memo, ReactNode, useCallback, useContext } from 'react'
import { useComponentClassName } from '../../auxiliary'
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

export const TableRow = memo(({ active, children, id, justification, onClick: onClickProp }: TableRowProps) => {
	const useTableElement = useContext(UseTableElementContext)
	const className = classNames(
		useComponentClassName('table-row'),
		toEnumViewClass(justification),
		toFeatureClass('hover', !!onClickProp),
		toFeatureClass('press', !!onClickProp),
		toStateClass('active', active),
	)

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
