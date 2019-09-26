import * as React from 'react'
import { Justification } from '../../types'
import cn from 'classnames'
import { toEnumViewClass } from '../../utils'
import { UseTableElementContext } from './Table'

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
