import { ReactNode } from 'react'
import { BoardNullColumn, BoardNullColumnProps, useBoardCurrentColumn } from '@contember/react-board'
import { useSortable } from '@dnd-kit/sortable'
import { BoardSortableNodeContext } from '../contexts'

export const BoardSortableNullColumn = ({ children }: BoardNullColumnProps) => {
	return (
		<BoardNullColumn>
			<BoardSortableNullColumnInner>
				{children}
			</BoardSortableNullColumnInner>
		</BoardNullColumn>
	)
}
const BoardSortableNullColumnInner = ({ children }: {
	children: ReactNode
}) => {
	const currentColumn = useBoardCurrentColumn()
	const sortableProps = useSortable({
		id: currentColumn.id,
		data: {
			type: 'column',
			column: currentColumn,
		},
	})

	return (
		<BoardSortableNodeContext.Provider value={sortableProps}>
			{children}
		</BoardSortableNodeContext.Provider>
	)
}
