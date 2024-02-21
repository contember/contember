import { createContext, createRequiredContext } from '@contember/react-utils'
import { useSortable } from '@dnd-kit/sortable'
import { BoardColumnNode, BoardItemNode } from '@contember/react-board'

const BoardSortableNodeContext_ = createRequiredContext<ReturnType<typeof useSortable>>('BoardSortableNodeContext')
/** @internal */
export const BoardSortableNodeContext = BoardSortableNodeContext_[0]
export const useBoardSortableNode = BoardSortableNodeContext_[1]

const BoardActiveItemContext_ = createContext<BoardItemNode & { column: BoardColumnNode } | undefined>('BoardActiveItemContext', undefined)
/** @internal */
export const BoardActiveItemContext = BoardActiveItemContext_[0]
export const useBoardActiveItem = BoardActiveItemContext_[1]

const BoardActiveColumnContext_ = createContext<BoardColumnNode | undefined>('BoardActiveColumnContext', undefined)
/** @internal */
export const BoardActiveColumnContext = BoardActiveColumnContext_[0]
export const useBoardActiveColumn = BoardActiveColumnContext_[1]
