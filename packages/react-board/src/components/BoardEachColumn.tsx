import { EntityAccessor } from '@contember/binding'
import { Entity } from '@contember/react-binding'
import { BoardCurrentColumnContext, useBoardColumns } from '../contexts'
import { ReactNode } from 'react'
import { BoardColumn } from './BoardColumn'
import { BoardNullColumnPlaceholder } from '../const'

export const BoardEachColumn = ({ children }: {
	children: ReactNode
}) => {
	const columns = useBoardColumns()

	return columns.map(column => {
		if (column.id === BoardNullColumnPlaceholder) {
			return null
		}
		return (
			<BoardCurrentColumnContext.Provider value={column} key={column.id}>
				{column.value instanceof EntityAccessor ? (
					<Entity accessor={column.value}>
						{children}
					</Entity>
				) : children}
			</BoardCurrentColumnContext.Provider>
		)
	})
}
BoardEachColumn.staticRender = ({ children }: { children: ReactNode }) => {
	return <BoardColumn>{children}</BoardColumn>
}
