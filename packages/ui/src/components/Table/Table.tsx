import cn from 'classnames'
import { createContext, memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import type { Justification, Size } from '../../types'
import { toEnumViewClass } from '../../utils'
import { Box } from '../Box'

export const UseTableElementContext = createContext(true)

export interface TableProps {
	children?: ReactNode
	heading?: ReactNode
	tableHead?: ReactNode
	size?: Size
	justification?: Justification
	//useTableElement?: boolean
}

export const Table = memo(({ /*useTableElement = true, */ ...props }: TableProps) => {
	const prefix = useClassNamePrefix()
	const className = cn(
		`${prefix}table`,
		toEnumViewClass(props.size),
		toEnumViewClass(props.justification, 'justifyStart'),
	)

	return (
		<UseTableElementContext.Provider value={/*useTableElement*/ true}>
			<Box heading={props.heading}>
				<div className={`${prefix}table-wrapper`}>
					{/*{useTableElement ? (*/}
					<table className={className}>
						{props.tableHead && <thead>{props.tableHead}</thead>}
						<tbody>{props.children}</tbody>
					</table>
					{/*) : (*/}
					{/*	<div className={className}>{props.children}</div>*/}
					{/*)}*/}
				</div>
			</Box>
		</UseTableElementContext.Provider>
	)
})
Table.displayName = 'Table'
