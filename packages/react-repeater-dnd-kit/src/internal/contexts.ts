import { createRequiredContext, createContext } from '@contember/react-utils'
import { EntityAccessor } from '@contember/react-binding'
import { useSortable } from '@dnd-kit/sortable'

export const [RepeaterSortableItemContext, useRepeaterSortableItem] = createRequiredContext<ReturnType<typeof useSortable>>('RepeaterSortableItemContext')
export const [RepeaterActiveEntityContext, useRepeaterActiveEntity] = createContext<EntityAccessor | undefined>('RepeaterActiveEntityContext', undefined)
