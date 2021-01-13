import * as React from 'react'
import { useClassNamePrefix, useComponentClassName } from '../../auxiliary'
import { Justification, Size } from '../../types'
import cn from 'classnames'
import { toEnumViewClass } from '../../utils'
import { Box } from '../Box'

export const UseTableElementContext = React.createContext(true)

export interface TableProps {
	children?: React.ReactNode
	heading?: React.ReactNode
	size?: Size
	justification?: Justification
	useTableElement?: boolean
}

export const Table = React.memo(({ useTableElement = true, ...props }: TableProps) => {
	const prefix = useClassNamePrefix()
	const className = cn(
		`${prefix}table`,
		toEnumViewClass(props.size),
		toEnumViewClass(props.justification, 'justifyStart'),
	)

	return (
		<UseTableElementContext.Provider value={useTableElement}>
			<Box heading={props.heading}>
				<div className={`${prefix}table-wrapper`}>
					{useTableElement ? (
						<table className={className}>{props.children}</table>
					) : (
						<div className={className}>{props.children}</div>
					)}
				</div>
			</Box>
		</UseTableElementContext.Provider>
	)
})
Table.displayName = 'Table'
