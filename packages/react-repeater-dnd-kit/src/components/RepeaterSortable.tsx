import React, { ReactNode, useCallback, useMemo, useState } from 'react'
import {
	DndContext,
	DragEndEvent,
	KeyboardSensor,
	MeasuringStrategy,
	MouseSensor,
	TouchSensor,
	UniqueIdentifier,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import { RepeaterActiveEntityContext } from '../internal/contexts'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useRepeaterSortedEntities } from '@contember/react-repeater'
import { useRepeaterMethods } from '@contember/react-repeater'

export const RepeaterSortable = ({ children }: {
	children: ReactNode
}) => {
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

	const onDragCancel = () => {
		setActiveId(null)
	}

	const onDragEnd = useCallback(({ active, over }: DragEndEvent) => {
		setActiveId(null)
		const activeEntity = entities.find(it => it.id === active.id)
		const overIndex = over ? entities.findIndex(it => it.id === over.id) : undefined
		if (!activeEntity || overIndex === undefined) {
			return
		}
		moveItem?.(activeEntity, overIndex)
	}, [entities, moveItem])

	return (
		<DndContext
			sensors={sensors}
			measuring={{
				droppable: {
					strategy: MeasuringStrategy.Always,
				},
			}}
			onDragStart={({ active }) => {
				setActiveId(active.id)
			}}
			onDragEnd={onDragEnd}
			onDragCancel={onDragCancel}
		>
			<SortableContext items={entities} strategy={verticalListSortingStrategy}>
				<RepeaterActiveEntityContext.Provider value={activeItem}>
					{children}
				</RepeaterActiveEntityContext.Provider>
			</SortableContext>
		</DndContext>
	)
}
