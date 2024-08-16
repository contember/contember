import React, { ReactNode } from 'react'
import { useBoardSortableNode } from '../contexts'

export const BoardSortableItemDropIndicator = ({ children, position }: {
	children: ReactNode
	position: 'before' | 'after'
}) => {
	const sortable = useBoardSortableNode()

	const { isOver, active, data } = sortable
	const showDropIndicator = isOver
		&& active?.data.current?.type === 'item'
		&& active?.data.current?.item?.id !== data?.item?.id
	const activeSortable = active?.data.current?.sortable
	const isAfter = data?.sortable.containerId === activeSortable?.containerId
		&& (data?.sortable.index ?? 0) > activeSortable?.index

	const renderedPosition = isAfter ? 'after' : 'before'

	return renderedPosition === position && showDropIndicator ? <>{children}</> : null
}
