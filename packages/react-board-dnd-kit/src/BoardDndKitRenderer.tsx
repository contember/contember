import React, { FunctionComponent, ReactNode, useCallback, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
	DndContext,
	DragEndEvent,
	DragOverlay,
	KeyboardSensor,
	MeasuringStrategy,
	MouseSensor,
	TouchSensor,
	UniqueIdentifier,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import { horizontalListSortingStrategy, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { coordinateGetter as multipleContainersCoordinateGetter } from './internal/multipleContainersKeyboardCoordinates'

import { AccessorTree, Entity, EntityAccessor, useAccessorTreeState } from '@contember/react-binding'
import { UseSortableProps } from './types'
import { BoardBindingProps, BoardColumn, BoardItem, BoardMethods } from '@contember/react-board'


type BoardIndexItem =
	| {
		type: 'column'
		column: BoardColumn
	}
	| {
		type: 'item'
		column: BoardColumn
		item: BoardItem
	}

type BoardIndex = Record<UniqueIdentifier, BoardIndexItem>


const useBoardIndex = (columns: BoardColumn[]): BoardIndex => {
	return useMemo(() => Object.fromEntries(columns.flatMap((column): [UniqueIdentifier, BoardIndexItem][] => [
		[column.id, { type: 'column', column }],
		...column.items.map((item): [UniqueIdentifier, BoardIndexItem] => [item.id, { type: 'item', column, item }]),
	])), [columns])
}

export type BoardDndKitRendererProps =
	& BoardBindingProps<any>


export type BoardColumnRendererProps = {
	children?: ReactNode
	value?: BoardColumn
	dragOverlay?: boolean
	sortableProps?: UseSortableProps
	boardMethods?: BoardMethods<any>
	dropIndicator?: 'before' | 'after'
};
export type BoardItemRendererProps = {
	value?: BoardItem,
	dragOverlay?: boolean,
	sortableProps?: UseSortableProps
	boardMethods?: BoardMethods<any>
	dropIndicator?: 'before' | 'after'
}

export const createBoardDndKitRenderer = <ColumnExtraProps extends {}, ItemExtraProps extends {}>({ Column, Item, Wrapper, usePortalProvider }: {
	Wrapper: React.ComponentType<{ children: ReactNode }>
	Column: React.ComponentType<BoardColumnRendererProps & ColumnExtraProps>
	Item: React.ComponentType<BoardItemRendererProps & ItemExtraProps>
	usePortalProvider?: () => Element | null
}): FunctionComponent<BoardDndKitRendererProps & ColumnExtraProps & ItemExtraProps> => {


	const SortableItem = ({ dragOverlay, value, boardMethods, column, ...props }: {
		value: BoardItem
		column: BoardColumn
		dragOverlay?: boolean
		boardMethods: BoardMethods<any>
	} & ItemExtraProps) => {
		const sortableProps = useSortable({
			id: value.id,
			data: {
				type: 'item',
				item: value,
				column,
			},
		})
		const { isOver, active, data } = sortableProps
		const showDropIndicator = isOver && active?.data.current?.type === 'item'
		const activeSortable = active?.data.current?.sortable
		const isAfter = data?.sortable.containerId === activeSortable?.containerId
			&& (data?.sortable.index ?? 0) > activeSortable?.index


		return (
			<Entity accessor={value.value}>
				<Item
					value={value}
					boardMethods={boardMethods}
					dragOverlay={dragOverlay}
					sortableProps={sortableProps}
					dropIndicator={showDropIndicator ? (isAfter ? 'after' : 'before') : undefined}
					{...props as unknown as ItemExtraProps}
				/>
			</Entity>
		)
	}


	const SortableColumn = ({ children, value, dragOverlay, boardMethods, ...props }: {
		children: ReactNode,
		value: BoardColumn,
		dragOverlay?: boolean
		boardMethods: BoardMethods<any>
	} & ColumnExtraProps) => {
		const sortableProps = useSortable({
			id: value.id,
			data: {
				type: 'column',
				column: value,
			},
		})
		const { active, isOver, over, data } = sortableProps
		const activeSortable = active?.data.current?.sortable

		const overColumnOrItsItem = isOver || (over?.data.current?.type === 'item' && over?.data.current?.column?.id === value?.id)
		const showDropIndicator = value?.value !== null && overColumnOrItsItem && active?.data.current?.type === 'column'
		const isAfter = data?.sortable.containerId === activeSortable?.containerId && (data?.sortable.index ?? 0) > activeSortable?.index

		return (
			<ColumnEntityWrapper value={value}>
				<Column
					value={value}
					dragOverlay={dragOverlay}
					sortableProps={sortableProps}
					boardMethods={boardMethods}
					dropIndicator={showDropIndicator ? (isAfter ? 'after' : 'before') : undefined}
					{...props as unknown as ColumnExtraProps}
				>
					{children}
				</Column>
			</ColumnEntityWrapper>
		)
	}

	const ColumnEntityWrapper = ({ value, children }: { value: BoardColumn, children: ReactNode,  }) => {
		if (!(value.value instanceof EntityAccessor)) {
			return <>{children}</>
		}
		return (
			<Entity accessor={value.value}>
				{children}
			</Entity>
		)
	}


	const ContainerDragOverlay = ({ column, boardMethods, ...props }: {
		column: BoardColumn,
		boardMethods: BoardMethods<any>
	} & ColumnExtraProps & ItemExtraProps) => (
		<ColumnEntityWrapper value={column}>
			<Column
				dragOverlay
				value={column}
				boardMethods={boardMethods}
				{...props as unknown as ColumnExtraProps}
			>
				{column.items.map(item => (
					<Entity accessor={item.value} key={item.id}>
						<Item
							dragOverlay
							value={item}
							boardMethods={boardMethods}
							{...props as unknown as ItemExtraProps}
						/>
					</Entity>
				))}
			</Column>
		</ColumnEntityWrapper>
	)

	return ({ columns, moveColumn, moveItem, removeColumn, removeItem, addItem, addColumn, ...extraProps }) => {
		const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)

		const boardMethods = useMemo(() => ({
			moveColumn,
			moveItem,
			removeColumn,
			removeItem,
			addItem,
			addColumn,
		}), [moveColumn, moveItem, removeColumn, removeItem, addItem, addColumn])

		const boardIndex = useBoardIndex(columns)

		const activeItem = activeId ? boardIndex[activeId] : undefined

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


		const portal = usePortalProvider ? usePortalProvider() : document.body

		const onDragEnd = useCallback(({ active, over }: DragEndEvent) => {
			setActiveId(null)

			const overItem = over ? boardIndex[over.id] : null
			const activeItem = boardIndex[active.id]
			if (!activeItem) {
				return
			}

			if (activeItem.type === 'column' && activeItem.column.value instanceof EntityAccessor) {
				console.log(overItem)
				moveColumn?.(activeItem.column.value, overItem?.column.index ?? columns.length)
				return
			}

			if (activeItem.type === 'item' && overItem) {
				moveItem?.(activeItem.item.value, overItem.column.value, overItem.type === 'item' ? overItem.item.index : overItem.column.items.length)
				return
			}
		}, [boardIndex, columns.length, moveColumn, moveItem])

		const accessorTreeState = useAccessorTreeState()

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
				<Wrapper>
					<SortableContext
						items={columns}
						strategy={horizontalListSortingStrategy}
					>
						{columns.map(column => (
							<SortableColumn
								key={column.id}
								value={column}
								boardMethods={boardMethods}

								{...extraProps as unknown as ColumnExtraProps}
							>
								<SortableContext items={column.items} strategy={verticalListSortingStrategy}>
									{column.items.map(value => (
										<SortableItem
											key={value.id}
											value={value}
											column={column}
											boardMethods={boardMethods}
											{...extraProps as unknown as ItemExtraProps}
										/>
									))}
								</SortableContext>
							</SortableColumn>
						))}
					</SortableContext>
				</Wrapper>
				{portal ? createPortal(
					<DragOverlay>
						<AccessorTree state={accessorTreeState}>
							{activeItem
								? activeItem.type === 'column'
									? <ContainerDragOverlay
										boardMethods={boardMethods}
										column={activeItem.column}
										{...extraProps as unknown as ColumnExtraProps & ItemExtraProps}
									/>
									: <Entity accessor={activeItem.item.value}>
										<Item
											dragOverlay
											value={activeItem.item}
											boardMethods={boardMethods}
											{...extraProps as unknown as ItemExtraProps}
										/>
									</Entity>
								: null}
						</AccessorTree>
					</DragOverlay>
					, portal) : null}
			</DndContext>
		)

	}
}
