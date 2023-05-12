import { useClassNameFactory } from '@contember/utilities'
import { ReactNode, createContext, memo } from 'react'
import type { Justification, Size } from '../../types'
import { toEnumViewClass } from '../../utils'
import { Box } from '../Box'
import { FieldContainer } from '../Forms/FieldContainer'

export const UseTableElementContext = createContext(true)

export interface TableProps {
	className?: string
	children?: ReactNode
	heading?: ReactNode
	tableHead?: ReactNode
	size?: Size
	justification?: Justification
	bare?: boolean
	//useTableElement?: boolean
}

/**
 * @group UI
 */
export const Table = memo(({ /*useTableElement = true, */ bare, className: classNameProp, ...props }: TableProps) => {
	const componentClassName = useClassNameFactory('table')

	const className = componentClassName(null, [
		toEnumViewClass(props.size),
		toEnumViewClass(props.justification, 'justifyStart'),
		classNameProp,
	])

	const table = (
		<div className={componentClassName('wrapper')}>
			{/*{useTableElement ? (*/}
			<table className={className}>
				{props.tableHead && <thead>{props.tableHead}</thead>}
				<tbody>{props.children}</tbody>
			</table>
			{/*) : (*/}
			{/*	<div className={className}>{props.children}</div>*/}
			{/*)}*/}
		</div>
	)

	return (
		<UseTableElementContext.Provider value={/*useTableElement*/ true}>
			<FieldContainer className={componentClassName('container')} label={!bare && props.heading} useLabelElement={false}>
				<Box padding="no-padding" className={componentClassName('container-box')}>
					{table}
				</Box>
			</FieldContainer>
		</UseTableElementContext.Provider>
	)
})
Table.displayName = 'Table'
