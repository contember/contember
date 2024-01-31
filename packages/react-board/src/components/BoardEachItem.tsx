import { ReactNode, useMemo } from 'react'
import { BoardCurrentItemContext, useBoardCurrentColumn } from '../contexts'
import { Entity } from '@contember/react-binding'
import { BoardItem } from './BoardItem'
import { BoardColumnNode, BoardItemNode } from '../types'

export const BoardEachItem = ({ children }: {
	children: ReactNode
}) => {
	const currentColumn = useBoardCurrentColumn()

	return currentColumn.items.map((item, index) => {
		return (
			<BoardEachItemInner
				key={item.id}
				item={item}
				column={currentColumn}
			>
				{children}
			</BoardEachItemInner>
		)
	})
}
BoardEachItem.staticRender = ({ children }: { children: ReactNode }) => {
	return <BoardItem>{children}</BoardItem>
}

const BoardEachItemInner = ({ children, item, column }: {
	children: ReactNode
	column: BoardColumnNode
	item: BoardItemNode

}) => {
	const itemWithColumn = useMemo(() => ({
		...item,
		column,
	}), [item, column])

	return (
		<BoardCurrentItemContext.Provider value={itemWithColumn} key={item.id}>
			<Entity accessor={item.value}>
				{children}
			</Entity>
		</BoardCurrentItemContext.Provider>
	)
}
