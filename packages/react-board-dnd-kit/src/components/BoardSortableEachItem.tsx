import { ReactNode } from 'react'
import { BoardEachItem, useBoardCurrentColumn, useBoardCurrentItem } from '@contember/react-board'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { BoardSortableNodeContext } from '../contexts'

export const BoardSortableEachItem = ({ children }: {
	children: ReactNode
}) => {
	const currentColumn = useBoardCurrentColumn()

	return (
		<SortableContext
			items={currentColumn.items}
			strategy={verticalListSortingStrategy}
		>
			<BoardEachItem>
				<BoardSortableEachItemInner>
					{children}
				</BoardSortableEachItemInner>
			</BoardEachItem>

		</SortableContext>)

}
BoardSortableEachItem.staticRender = ({ children }: { children: ReactNode }) => {
	return <BoardEachItem>{children}</BoardEachItem>
}

const BoardSortableEachItemInner = ({ children }: {
	children: ReactNode
}) => {
	const currentItem = useBoardCurrentItem()
	const sortableProps = useSortable({
		id: currentItem.id,
		data: {
			type: 'item',
			item: currentItem,
			column: currentItem.column,
		},
	})

	return (
		<BoardSortableNodeContext.Provider value={sortableProps}>
			{children}
		</BoardSortableNodeContext.Provider>
	)
}
