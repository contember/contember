import React, { ReactNode } from 'react'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { RepeaterEachItem, useRepeaterSortedEntities } from '@contember/react-repeater'
import { RepeaterSortableItemContext } from '../contexts'
import { useEntity } from '@contember/react-binding'

/**
 * Iterates over all entities in the repeater and renders the children for each entity.
 * Also sets up the dnd-kit sortable context for the repeater items.
 */
export const RepeaterSortableEachItem = ({ children }: {
	children: ReactNode
}) => {
	const entities = useRepeaterSortedEntities()

	return (
		<SortableContext items={entities} strategy={verticalListSortingStrategy}>
			<RepeaterEachItem>
				<RepeaterSortableEachItemInner>
					{children}
				</RepeaterSortableEachItemInner>

			</RepeaterEachItem>
		</SortableContext>
	)
}
const RepeaterSortableEachItemInner = ({ children }: {
	children: ReactNode
}) => {
	const entity = useEntity()
	const sortable = useSortable({
		id: entity.id,
	})
	return (
		<RepeaterSortableItemContext.Provider value={sortable}>
			{children}
		</RepeaterSortableItemContext.Provider>
	)
}
