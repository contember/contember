import { EntityAccessor, EntityId, EntityListAccessor, RelativeSingleField, sortEntities } from '@contember/react-binding'
import { useCallback } from 'react'

export type BoardColumnKey = string | EntityId | null
export type UseGroupItemsByColumn = (itemEntities: EntityListAccessor) => Map<BoardColumnKey, EntityAccessor[]>
export const useGroupItemsByColumn = (getDiscriminatorValue: (entity: EntityAccessor) => BoardColumnKey, sortBy: RelativeSingleField | undefined): UseGroupItemsByColumn => {
	return useCallback((itemEntities: EntityListAccessor) => {
		const itemsByColumn = new Map<BoardColumnKey, EntityAccessor[]>()

		for (const item of sortEntities(Array.from(itemEntities), sortBy)) {
			const discriminatedBy = getDiscriminatorValue(item)
			if (!itemsByColumn.has(discriminatedBy)) {
				itemsByColumn.set(discriminatedBy, [])
			}
			itemsByColumn.get(discriminatedBy)?.push(item)
		}
		return itemsByColumn
	}, [getDiscriminatorValue, sortBy])
}
