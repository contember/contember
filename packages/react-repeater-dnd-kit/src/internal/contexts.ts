import { createNonNullableContextFactory, createOptionalContextFactory } from '@contember/react-utils'
import { EntityAccessor } from '@contember/react-binding'
import { useSortable } from '@dnd-kit/sortable'

export const [RepeaterSortableItemContext, useRepeaterSortableItem] = createNonNullableContextFactory<ReturnType<typeof useSortable>>('RepeaterSortableItemContext')
export const [RepeaterActiveEntityContext, useRepeaterActiveEntity] = createOptionalContextFactory<EntityAccessor | undefined>('RepeaterActiveEntityContext', undefined)
