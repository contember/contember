import { createRequiredContext } from '@contember/react-utils'
import { BoardColumnNode, BoardColumnValue, BoardItemNode, BoardMethods } from './types'

const _BoardMethodsContext = createRequiredContext<BoardMethods<any>>('BoardMethodsContext')
/** @internal */
export const BoardMethodsContext = _BoardMethodsContext[0]
export const useBoardMethods = _BoardMethodsContext[1] as <T extends BoardColumnValue = BoardColumnValue>() => BoardMethods<T>


const BoardColumnsContext_ = createRequiredContext<BoardColumnNode[]>('BoardColumnsContext')
/** @internal */
export const BoardColumnsContext = BoardColumnsContext_[0]
export const useBoardColumns = BoardColumnsContext_[1] as <T extends BoardColumnValue = BoardColumnValue>() => BoardColumnNode<T>[]

const _BoardColumnContext = createRequiredContext<BoardColumnNode>('BoardCurrentColumnContext')
/** @internal*/
export const BoardCurrentColumnContext = _BoardColumnContext[0]
export const useBoardCurrentColumn = _BoardColumnContext[1]

const BoardCurrentItemContext_ = createRequiredContext<BoardItemNode & { column: BoardColumnNode }>('BoardCurrentItemContext')
/** @internal*/
export const BoardCurrentItemContext = BoardCurrentItemContext_[0]
export const useBoardCurrentItem = BoardCurrentItemContext_[1]
