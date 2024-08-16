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
import { coordinateGetter as multipleContainersCoordinateGetter } from '../internal/multipleContainersKeyboardCoordinates'
import { BoardColumnNode, BoardItemNode, useBoardColumns, useBoardMethods } from '@contember/react-board'
import { EntityAccessor } from '@contember/binding'
import { BoardActiveColumnContext, BoardActiveItemContext } from '../contexts'

type BoardIndexItem =
	| {
		type: 'column'
		column: BoardColumnNode
	}
	| {
		type: 'item'
		column: BoardColumnNode
		item: BoardItemNode
	}

type BoardIndex = Record<UniqueIdentifier, BoardIndexItem>


const useBoardIndex = (columns: BoardColumnNode[]): BoardIndex => {
	return useMemo(() => Object.fromEntries(columns.flatMap((column): [UniqueIdentifier, BoardIndexItem][] => [
		[column.id, { type: 'column', column }],
		...column.items.map((item): [UniqueIdentifier, BoardIndexItem] => [item.id, { type: 'item', column, item }]),
	])), [columns])
}

export const BoardSortable = ({ children }: {
	children: ReactNode
}) => {
	const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)

	const columns = useBoardColumns()
	const { moveItem, moveColumn } = useBoardMethods()

	const boardIndex = useBoardIndex(columns)

	const activeNode = activeId ? boardIndex[activeId] : undefined

	const activeItem = useMemo(() => activeNode?.type === 'item' ? ({ ...activeNode.item, column: activeNode.column }) : undefined, [activeNode])

	const sensors = useSensors(
		useSensor(MouseSensor),
		useSensor(TouchSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: multipleContainersCoordinateGetter,
		}),
	)

	const onDragCancel = () => {
		setActiveId(null)
	}


	const onDragEnd = useCallback(({ active, over }: DragEndEvent) => {
		setActiveId(null)

		const overItem = over ? boardIndex[over.id] : null
		const activeItem = boardIndex[active.id]
		if (!activeItem) {
			return
		}

		if (activeItem.type === 'column' && activeItem.column.value instanceof EntityAccessor) {
			moveColumn?.(activeItem.column.value, overItem?.column.index ?? columns.length)
			return
		}

		if (activeItem.type === 'item' && overItem) {
			moveItem?.(activeItem.item.value, overItem.column.value, overItem.type === 'item' ? overItem.item.index : overItem.column.items.length)
			return
		}
	}, [boardIndex, columns.length, moveColumn, moveItem])


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
			<BoardActiveColumnContext.Provider value={activeNode?.type === 'column' ? activeNode.column : undefined}>
				<BoardActiveItemContext.Provider value={activeItem}>
					{children}
				</BoardActiveItemContext.Provider>
			</BoardActiveColumnContext.Provider>
		</DndContext>
	)

}
