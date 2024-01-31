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
import {
	Board as BoardInternal,
	BoardColumn,
	BoardEachColumn,
	BoardEachItem,
	BoardItem,
	BoardNullColumn,
	BoardProps as BoardPropsInternal,
} from '@contember/react-board'
import { GripHorizontal, GripIcon } from 'lucide-react'
import { Component } from '@contember/interface'
import { ReactNode } from 'react'
import { uic } from '../utils/uic'
import { DropIndicator } from './ui/sortable'

export const BoardWrapperUI = uic('div', {
	baseClass: 'flex gap-4',
})
export const BoardItemsWrapperUI = uic('div', {
	baseClass: 'flex flex-col gap-4 p-2',
})
export const BoardColumnHeaderUI = uic('div', {
	baseClass: 'px-4 py-1 border-b bg-gray-50',
})
export const BoardCardUI = uic('div', {
	baseClass: 'rounded border border-gray-300 p-4 relative',
})
export const BoardColumnUI = uic('div', {
	baseClass: 'rounded border border-gray-300 relative min-w-48 data-[sortable-over="item"]:bg-yellow-100',
})
export const BoardDragOverlayUI = uic('div', {
	baseClass: 'rounded border border-gray-300 p-4 relative bg-opacity-60 bg-gray-100 backdrop-blur-sm',
})
export const BoardItemHandleUI = uic('button', {
	baseClass: 'absolute top-0 right-0 h-6 w-6 flex justify-end align-center opacity-10 hover:opacity-100 transition-opacity',
	beforeChildren: <GripIcon size={16} />,
})

export const BoardColumnHandleUI = uic('button', {
	baseClass: 'absolute top-0 right-0 h-6 w-6 flex justify-end align-center opacity-10 hover:opacity-100 transition-opacity',
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
	children: ReactNode,
	columnHeader: ReactNode,
	columnFooter?: ReactNode,
	nullColumnHeader: ReactNode,
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

		<BoardSortableNullColumn>
			<BoardSortableNode>
				<BoardColumnUI>
					<BoardColumnHeaderUI>
						{nullColumnHeader}
					</BoardColumnHeaderUI>
					{children}
					{columnFooter}
				</BoardColumnUI>
			</BoardSortableNode>
		</BoardSortableNullColumn>
	</>
))
export const BoardNonSortableColumn = Component<{
	children: ReactNode,
	columnHeader: ReactNode,
	columnFooter?: ReactNode,
	nullColumnHeader: ReactNode
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

		<BoardNullColumn>
			<BoardColumnUI>
				<BoardColumnHeaderUI>
					{nullColumnHeader}
				</BoardColumnHeaderUI>
				{children}
				{columnFooter}
			</BoardColumnUI>
		</BoardNullColumn>
	</>
))


export type DefaultBoardProps =
	& {
		columnHeader: ReactNode
		nullColumnHeader: ReactNode
		columnFooter?: ReactNode,
		children: ReactNode
	}
	& BoardPropsInternal

export const DefaultBoard = Component<DefaultBoardProps>(({ columnHeader, nullColumnHeader, children, columnFooter, ...props }) => {
	const itemsSortable = 'sortableBy' in props && props.sortableBy !== undefined
	const columnsSortable = 'columnsSortableBy' in props && props.columnsSortableBy !== undefined
	const anySortable = itemsSortable || columnsSortable
	if (!anySortable) {
		return (
			<BoardInternal {...props}>
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
			</BoardInternal>
		)
	}
	const ItemsComponent = itemsSortable ? BoardSortableItems : BoardNonSortableItems

	return (
		<BoardInternal {...props}>
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
		</BoardInternal>
	)
}, ({ children, columnHeader, nullColumnHeader, ...props }) => {
	return <>
		<BoardInternal {...props}>
			<BoardItem>
				{children}
			</BoardItem>
			<BoardColumn>
				{columnHeader}
			</BoardColumn>
		</BoardInternal>
	</>
})
