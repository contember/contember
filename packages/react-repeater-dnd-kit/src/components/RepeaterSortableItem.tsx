import React, { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { RepeaterSortableItemContext } from '../internal/contexts'
import { useEntity } from '@contember/react-binding'

export const RepeaterSortableItem = ({ children }: {
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
