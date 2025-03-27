import {
	BoardSortable,
	BoardSortableActivator,
	BoardSortableColumnDragOverlay,
	BoardSortableColumnDropIndicator,
	BoardSortableEachColumn,
	BoardSortableEachItem,
	BoardSortableItemDragOverlay,
	BoardSortableItemDropIndicator,
	BoardSortableNode,
	BoardSortableNullColumn,
} from '@contember/react-board-dnd-kit'
import { Board, BoardColumn, BoardEachColumn, BoardEachItem, BoardItem, BoardNullColumn, BoardProps } from '@contember/react-board'
import { GripHorizontal, GripIcon } from 'lucide-react'
import { Component } from '@contember/interface'
import { ReactNode } from 'react'
import { uic } from '../utils'
import { DropIndicator } from '../ui/sortable'

export const BoardWrapperUI = uic('div', {
	baseClass: 'flex gap-4 max-w-full overflow-x-auto -mx-2 px-2 pb-4',
})
export const BoardItemsWrapperUI = uic('div', {
	baseClass: 'flex flex-col gap-2 p-2',
})
export const BoardColumnHeaderUI = uic('div', {
	baseClass: 'px-4 py-1 border-b border-gray-100',
})
export const BoardCardUI = uic('div', {
	baseClass: 'rounded-sm border border-gray-200 bg-card text-card-foreground shadow-xs p-4 relative hover:shadow-md transition-all duration-200',
})
export const BoardColumnUI = uic('div', {
	baseClass: 'rounded-lg border border-gray-200 bg-card text-card-foreground shadow-md relative min-w-48 data-[sortable-over="item"]:bg-yellow-100 hover:shadow-lg transition-all duration-200',
})
export const BoardDragOverlayUI = uic('div', {
	baseClass: 'rounded-sm border border-gray-200 border-gray-300 p-4 relative bg-gray-100/60 backdrop-blur-xs',
})
export const BoardItemHandleUI = uic('button', {
	baseClass: 'absolute top-0 right-0 h-5 w-5 flex justify-center items-center opacity-10 hover:opacity-100 transition-opacity',
	beforeChildren: <GripIcon size={16} />,
})

export const BoardColumnHandleUI = uic('button', {
	baseClass: 'absolute top-0 right-0 h-6 w-6 flex justify-end items-center opacity-10 hover:opacity-100 transition-opacity',
	beforeChildren: <GripHorizontal size={16} />,
})

export const ItemDropIndicator = ({ position }: { position: 'before' | 'after' }) => (
	<div className={'relative'}>
		<BoardSortableItemDropIndicator position={position}>
			<DropIndicator placement={position === 'before' ? 'top' : 'bottom'} />
		</BoardSortableItemDropIndicator>
	</div>
)

export const ColumnDropIndicator = ({ position }: { position: 'before' | 'after' }) => (
	<div className={'relative'}>
		<BoardSortableColumnDropIndicator position={position}>
			<DropIndicator placement={position === 'before' ? 'left' : 'right'} />
		</BoardSortableColumnDropIndicator>
	</div>
)

export const BoardSortableItems = Component<{ children: ReactNode }>(({ children }) => (
	<BoardItemsWrapperUI>
		<BoardSortableEachItem>
			<div>
				<ItemDropIndicator position={'before'} />
				<BoardSortableNode>
					<BoardCardUI>
						{children}
						<BoardSortableActivator>
							<BoardItemHandleUI />
						</BoardSortableActivator>
					</BoardCardUI>
				</BoardSortableNode>
				<ItemDropIndicator position={'after'} />
			</div>
		</BoardSortableEachItem>
	</BoardItemsWrapperUI>
))

export const BoardNonSortableItems = Component<{ children: ReactNode }>(({ children }) => (
	<BoardItemsWrapperUI>
		<BoardEachItem>
			<BoardCardUI>
				{children}
			</BoardCardUI>
		</BoardEachItem>
	</BoardItemsWrapperUI>
))

export const BoardSortableColumn = Component<{
	children: ReactNode
	columnHeader: ReactNode
	columnFooter?: ReactNode
	nullColumnHeader?: ReactNode
	sortable: boolean // even if not sortable, we still want to make column droppable
}>(({ children, columnHeader, nullColumnHeader, columnFooter, sortable }) => (
	<>
		<BoardSortableEachColumn>
			<div className={'flex'}>
				{sortable && <ColumnDropIndicator position={'before'} />}

				<BoardSortableNode>
					<BoardColumnUI>
						{sortable && (
							<BoardSortableActivator>
								<BoardColumnHandleUI />
							</BoardSortableActivator>
						)}
						<BoardColumnHeaderUI>
							{columnHeader}
						</BoardColumnHeaderUI>
						{children}
						{columnFooter}
					</BoardColumnUI>
				</BoardSortableNode>

				{sortable && <ColumnDropIndicator position={'after'} />}
			</div>
		</BoardSortableEachColumn>

		{nullColumnHeader && <BoardSortableNullColumn>
			<BoardSortableNode>
				<BoardColumnUI>
					<BoardColumnHeaderUI>
						{nullColumnHeader}
					</BoardColumnHeaderUI>
					{children}
					{columnFooter}
				</BoardColumnUI>
			</BoardSortableNode>
		</BoardSortableNullColumn>}
	</>
))
export const BoardNonSortableColumn = Component<{
	children: ReactNode
	columnHeader: ReactNode
	columnFooter?: ReactNode
	nullColumnHeader?: ReactNode
}>(({ children, columnHeader, nullColumnHeader, columnFooter }) => (
	<>
		<BoardEachColumn>
			<BoardColumnUI>
				<BoardColumnHeaderUI>
					{columnHeader}
				</BoardColumnHeaderUI>
				{children}
				{columnFooter}
			</BoardColumnUI>
		</BoardEachColumn>

		{nullColumnHeader && <BoardNullColumn>
			<BoardColumnUI>
				<BoardColumnHeaderUI>
					{nullColumnHeader}
				</BoardColumnHeaderUI>
				{children}
				{columnFooter}
			</BoardColumnUI>
		</BoardNullColumn>}
	</>
))


export type DefaultBoardProps =
	& {
		columnHeader: ReactNode
		nullColumnHeader?: ReactNode
		columnFooter?: ReactNode
		children: ReactNode
	}
	& BoardProps

export const DefaultBoard = Component<DefaultBoardProps>(({ columnHeader, nullColumnHeader, children, columnFooter, ...props }) => {
	const itemsSortable = 'sortableBy' in props && props.sortableBy !== undefined
	const columnsSortable = 'columnsSortableBy' in props && props.columnsSortableBy !== undefined
	const anySortable = itemsSortable || columnsSortable
	if (!anySortable) {
		return (
			<Board {...props}>
				<BoardWrapperUI>
					<BoardNonSortableColumn
						columnHeader={columnHeader}
						columnFooter={columnFooter}
						nullColumnHeader={nullColumnHeader}
					>
						<BoardNonSortableItems>
							{children}
						</BoardNonSortableItems>
					</BoardNonSortableColumn>
				</BoardWrapperUI>
			</Board>
		)
	}
	const ItemsComponent = itemsSortable ? BoardSortableItems : BoardNonSortableItems

	return (
		<Board {...props}>
			<BoardSortable>
				<BoardWrapperUI>
					<BoardSortableColumn
						columnHeader={columnHeader}
						columnFooter={columnFooter}
						nullColumnHeader={nullColumnHeader}
						sortable={columnsSortable}
					>
						<ItemsComponent>
							{children}
						</ItemsComponent>
					</BoardSortableColumn>
				</BoardWrapperUI>

				{columnsSortable ? <BoardSortableColumnDragOverlay>
					<BoardDragOverlayUI>
						{columnHeader}
					</BoardDragOverlayUI>
				</BoardSortableColumnDragOverlay> : null}

				{itemsSortable ? <BoardSortableItemDragOverlay>
					<BoardDragOverlayUI>
						{children}
					</BoardDragOverlayUI>
				</BoardSortableItemDragOverlay> : null}
			</BoardSortable>
		</Board>
	)
}, ({ children, columnHeader, nullColumnHeader, ...props }) => {
	return <>
		<Board {...props}>
			<BoardItem>
				{children}
			</BoardItem>
			<BoardColumn>
				{columnHeader}
			</BoardColumn>
		</Board>
	</>
})
