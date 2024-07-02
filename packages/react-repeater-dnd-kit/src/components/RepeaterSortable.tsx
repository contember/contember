import React, { ReactNode, useCallback, useMemo, useState } from 'react'
import type { DragStartEvent } from '@dnd-kit/core'
import { closestCenter, DndContext, DndContextProps, DragCancelEvent, DragEndEvent, KeyboardSensor, MeasuringStrategy, MouseSensor, TouchSensor, UniqueIdentifier, useSensor, useSensors } from '@dnd-kit/core'
import { RepeaterActiveEntityContext } from '../contexts'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useRepeaterMethods, useRepeaterSortedEntities } from '@contember/react-repeater'

export const RepeaterSortable = ({ children, onDragStart, onDragEnd: onDragEndIn, onDragCancel: onDragCancelIn, ...props }: {
	children: ReactNode
} & DndContextProps) => {
	const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
	const { moveItem } = useRepeaterMethods()
	const entities = useRepeaterSortedEntities()


	const activeItem = useMemo(() => {
		if (!activeId) {
			return undefined
		}
		return entities.find(it => it.id === activeId)
	}, [activeId, entities])

	const sensors = useSensors(
		useSensor(MouseSensor),
		useSensor(TouchSensor),
		useSensor(KeyboardSensor),
	)

	const onDragCancel = (event: DragCancelEvent) => {
		onDragCancelIn?.(event)
		setActiveId(null)
	}

	const onDragEnd = useCallback((event: DragEndEvent) => {
		onDragEndIn?.(event)
		setActiveId(null)
		const { active, over } = event
		const activeEntity = entities.find(it => it.id === active.id)
		const overIndex = over ? entities.findIndex(it => it.id === over.id) : undefined
		if (!activeEntity || overIndex === undefined) {
			return
		}
		moveItem?.(activeEntity, overIndex)
	}, [entities, moveItem, onDragEndIn])

	return (
		<DndContext
			sensors={sensors}
			measuring={{
				droppable: {
					strategy: MeasuringStrategy.Always,
				},
			}}
			collisionDetection={closestCenter}
			{...props}
			onDragStart={(event: DragStartEvent) => {
				onDragStart?.(event)
				setActiveId(event.active.id)
			}}
			onDragEnd={onDragEnd}
			onDragCancel={onDragCancel}
		>
			<RepeaterActiveEntityContext.Provider value={activeItem}>
				<SortableContext items={entities} strategy={verticalListSortingStrategy}>
					{children}
				</SortableContext>
			</RepeaterActiveEntityContext.Provider>
		</DndContext>
	)
}
