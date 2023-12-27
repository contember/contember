import { createBoardDndKit } from '@contember/react-board-dnd-kit'
import { BoardBaseProps } from '@contember/react-board'
import { BoardColumn, BoardColumnExtraProps } from './ui/BoardColumn'
import { BoardItem, BoardItemExtraProps } from './ui/BoardItem'
import { Stack, usePortalProvider } from '@contember/ui'
import { ComponentType } from 'react'



export type BoardProps = BoardBaseProps<BoardColumnExtraProps & BoardItemExtraProps>

export const Board: ComponentType<BoardProps> = createBoardDndKit({
	Column: BoardColumn,
	Item: BoardItem,
	Wrapper: ({ children }) => <Stack horizontal>{children}</Stack>,
	usePortalProvider: usePortalProvider,
})
