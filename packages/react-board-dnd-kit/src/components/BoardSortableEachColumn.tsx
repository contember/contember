import { ReactNode } from 'react'
import { BoardEachColumn, useBoardColumns, useBoardCurrentColumn } from '@contember/react-board'
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable'
import { BoardSortableNodeContext } from '../contexts'

export const BoardSortableEachColumn = ({ children }: {
	children: ReactNode
}) => {
	const columns = useBoardColumns()

	return (
		<SortableContext
			items={columns}
			strategy={horizontalListSortingStrategy}
		>
			<BoardEachColumn>
				<BoardSortableEachColumnInner>
					{children}
				</BoardSortableEachColumnInner>
			</BoardEachColumn>

		</SortableContext>)

}
BoardSortableEachColumn.staticRender = ({ children }: { children: ReactNode }) => {
	return <BoardEachColumn>{children}</BoardEachColumn>
}
const BoardSortableEachColumnInner = ({ children }: {
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
