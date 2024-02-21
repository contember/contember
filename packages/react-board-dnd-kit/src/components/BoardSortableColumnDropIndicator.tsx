import React, { ReactNode } from 'react'
import { useBoardSortableNode } from '../contexts'

export const BoardSortableColumnDropIndicator = ({ children, position }: {
	children: ReactNode
	position: 'before' | 'after'
}) => {
	const sortable = useBoardSortableNode()

	const { isOver, active, data, over } = sortable

	const activeSortable = active?.data.current?.sortable

	const overColumnOrItsItem = isOver || (over?.data.current?.type === 'item' && over?.data.current?.column?.id === data?.column?.id)
	const showDropIndicator = data?.column.value !== null
		&& overColumnOrItsItem
		&& active?.data.current?.type === 'column'
		&& active?.data.current?.column?.id !== data?.column?.id

	const isAfter = data?.sortable.containerId === activeSortable?.containerId && (data?.sortable.index ?? 0) > activeSortable?.index

	const renderedPosition = isAfter ? 'after' : 'before'

	return renderedPosition === position && showDropIndicator ? <>{children}</> : null
}
