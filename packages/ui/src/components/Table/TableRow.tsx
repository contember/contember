import {
	ReactNode,
	ReactElement,
	useMemo,
	useCallback,
	useEffect,
	useRef,
	ComponentType,
	MouseEvent as ReactMouseEvent,
	memo,
	useState,
	useContext,
} from 'react'
import { useComponentClassName } from '../../auxiliary'
import { Justification } from '../../types'
import cn from 'classnames'
import { toEnumViewClass } from '../../utils'
import { UseTableElementContext } from './Table'

export interface TableRowProps {
	children?: ReactNode
	justification?: Justification
}

export const TableRow = memo((props: TableRowProps) => {
	const useTableElement = useContext(UseTableElementContext)
	const className = cn(useComponentClassName('table-row'), toEnumViewClass(props.justification))

	if (useTableElement) {
		return <tr className={className}>{props.children}</tr>
	}
	return <div className={className}>{props.children}</div>
})
TableRow.displayName = 'TableRow'
