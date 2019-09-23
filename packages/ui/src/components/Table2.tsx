import * as React from 'react'
import { Box } from './Box'
import cn from 'classnames'
import { Justification } from '../types'
import { toEnumViewClass, toViewClass } from '../utils'

const UseTableElementContext = React.createContext(true)

export interface Table2Props {
	children?: React.ReactNode
	heading?: React.ReactNode
	compact?: boolean
	justification?: Justification
	useTableElement?: boolean
}
export const Table2 = React.memo(({ useTableElement = true, compact = false, ...props }: Table2Props) => {
	const className = cn('table2', compact && 'view-compact', toEnumViewClass(props.justification, 'justifyStart'))

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
Table2.displayName = 'Table2'

export interface Table2RowProps {
	children?: React.ReactNode
	justification?: Justification
}
export const Table2Row = React.memo((props: Table2RowProps) => {
	const useTableElement = React.useContext(UseTableElementContext)
	const className = cn('table2-row', toEnumViewClass(props.justification))

	if (useTableElement) {
		return <tr className={className}>{props.children}</tr>
	}
	return <div className={className}>{props.children}</div>
})
Table2Row.displayName = 'Table2Row'

export interface Table2CellProps {
	children?: React.ReactNode
	justification?: Justification
	shrink?: boolean
}
export const Table2Cell = React.memo(({ shrink = false, ...props }: Table2CellProps) => {
	const useTableElement = React.useContext(UseTableElementContext)
	const className = cn('table2-cell', toEnumViewClass(props.justification), toViewClass('shrink', shrink))

	if (useTableElement) {
		return <td className={className}>{props.children}</td>
	}
	return <div className={className}>{props.children}</div>
})
Table2Cell.displayName = 'Table2Cell'
