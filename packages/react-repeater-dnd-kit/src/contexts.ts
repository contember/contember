import { createRequiredContext, createContext } from '@contember/react-utils'
import { EntityAccessor } from '@contember/react-binding'
import { useSortable } from '@dnd-kit/sortable'

const RepeaterSortableItemContext_ = createRequiredContext<ReturnType<typeof useSortable>>('RepeaterSortableItemContext')
/** @internal */
export const RepeaterSortableItemContext = RepeaterSortableItemContext_[0]
export const useRepeaterSortableItem = RepeaterSortableItemContext_[1]

const RepeaterActiveEntityContext_ = createContext<EntityAccessor | undefined>('RepeaterActiveEntityContext', undefined)
/** @internal */
export const RepeaterActiveEntityContext = RepeaterActiveEntityContext_[0]
export const useRepeaterActiveEntity = RepeaterActiveEntityContext_[1]
