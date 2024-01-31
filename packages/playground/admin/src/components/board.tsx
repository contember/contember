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

const BoardWrapperUI = uic('div', {
	baseClass: 'flex gap-4',
})
const BoardItemsWrapperUI = uic('div', {
	baseClass: 'flex flex-col gap-4 p-2',
})
const BoardColumnHeaderUI = uic('div', {
	baseClass: 'px-4 py-1 border-b bg-gray-50',
})
const BoardCardUI = uic('div', {
	baseClass: 'rounded border border-gray-300 p-4 relative',
})
const BoardColumnUI = uic('div', {
	baseClass: 'rounded border border-gray-300 relative min-w-48 data-[sortable-over="item"]:bg-yellow-100',
})
const BoardDragOverlayUI = uic('div', {
	baseClass: 'rounded border border-gray-300 p-4 relative bg-opacity-60 bg-gray-100 backdrop-blur-sm',
})
const BoardItemHandleUI = uic('button', {
	baseClass: 'absolute top-0 right-0 h-6 w-6 flex justify-end align-center opacity-10 hover:opacity-100 transition-opacity',
	beforeChildren: <GripIcon size={16} />,
})

const BoardColumnHandleUI = uic('button', {
	baseClass: 'absolute top-0 right-0 h-6 w-6 flex justify-end align-center opacity-10 hover:opacity-100 transition-opacity',
	beforeChildren: <GripHorizontal size={16} />,
})

const BoardDropIndicatorUI = uic('div', {
	baseClass: 'bg-blue-300 absolute',
	variants: {
		placement: {
			top: 'w-full h-1 -top-2',
			bottom: 'w-full h-1 -bottom-2',
			left: 'w-1 h-full -left-2',
			right: 'w-1 h-full -right-2',
		},
	},
})


const ItemDropIndicator = ({ position }: { position: 'before' | 'after' }) => (
	<div className={'relative'}>
		<BoardSortableItemDropIndicator position={position}>
			<BoardDropIndicatorUI placement={position === 'before' ? 'top' : 'bottom'} />
		</BoardSortableItemDropIndicator>
	</div>
)

const ColumnDropIndicator = ({ position }: { position: 'before' | 'after' }) => (
	<div className={'relative'}>
		<BoardSortableColumnDropIndicator position={position}>
			<BoardDropIndicatorUI placement={position === 'before' ? 'left' : 'right'} />
		</BoardSortableColumnDropIndicator>
	</div>
)

const BoardSortableItems = Component<{ children: ReactNode }>(({ children }) => (
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

const BoardNonSortableItems = Component<{ children: ReactNode }>(({ children }) => (
	<BoardItemsWrapperUI>
		<BoardEachItem>
			<BoardCardUI>
				{children}
			</BoardCardUI>
		</BoardEachItem>
	</BoardItemsWrapperUI>
))

const BoardSortableColumn = Component<{
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
const BoardNonSortableColumn = Component<{
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


export type BoardProps =
	& {
		columnHeader: ReactNode
		nullColumnHeader: ReactNode
		columnFooter?: ReactNode,
		children: ReactNode
	}
	& BoardPropsInternal

export const Board = Component<BoardProps>(({ columnHeader, nullColumnHeader, children, columnFooter, ...props }) => {
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
