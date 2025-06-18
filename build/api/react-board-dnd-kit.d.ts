import { Active } from '@dnd-kit/core';
import { BoardColumnNode } from '@contember/react-board';
import { BoardItemNode } from '@contember/react-board';
import { BoardNullColumnProps } from '@contember/react-board';
import { ClientRect as ClientRect_2 } from '@dnd-kit/core';
import { Context } from 'react';
import { DraggableAttributes } from '@dnd-kit/core';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { MutableRefObject } from 'react';
import { Over } from '@dnd-kit/core';
import { ReactNode } from 'react';
import { SortableData } from '@dnd-kit/sortable';
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { Transform } from '@dnd-kit/utilities';
import { UniqueIdentifier } from '@dnd-kit/core';

/** @internal */
export declare const BoardActiveColumnContext: Context<BoardColumnNode | undefined>;

/** @internal */
export declare const BoardActiveItemContext: Context<(BoardItemNode & {
column: BoardColumnNode;
}) | undefined>;

export declare const BoardSortable: ({ children }: {
    children: ReactNode;
}) => JSX_2.Element;

export declare const BoardSortableActivator: ({ children }: {
    children: ReactNode;
}) => JSX_2.Element;

export declare const BoardSortableColumnDragOverlay: ({ children }: {
    children: ReactNode;
}) => JSX_2.Element | null;

export declare const BoardSortableColumnDropIndicator: ({ children, position }: {
    children: ReactNode;
    position: "before" | "after";
}) => JSX_2.Element | null;

export declare const BoardSortableEachColumn: {
    ({ children }: {
        children: ReactNode;
    }): JSX_2.Element;
    staticRender({ children }: {
        children: ReactNode;
    }): JSX_2.Element;
};

export declare const BoardSortableEachItem: {
    ({ children }: {
        children: ReactNode;
    }): JSX_2.Element;
    staticRender({ children }: {
        children: ReactNode;
    }): JSX_2.Element;
};

export declare const BoardSortableItemDragOverlay: ({ children }: {
    children: ReactNode;
}) => JSX_2.Element | null;

export declare const BoardSortableItemDropIndicator: ({ children, position }: {
    children: ReactNode;
    position: "before" | "after";
}) => JSX_2.Element | null;

export declare const BoardSortableNode: ({ children }: {
    children: ReactNode;
}) => JSX_2.Element;

/** @internal */
export declare const BoardSortableNodeContext: Context<    {
active: Active | null;
activeIndex: number;
attributes: DraggableAttributes;
data: SortableData & {
[x: string]: any;
};
rect: MutableRefObject<ClientRect_2 | null>;
index: number;
newIndex: number;
items: UniqueIdentifier[];
isOver: boolean;
isSorting: boolean;
isDragging: boolean;
listeners: SyntheticListenerMap | undefined;
node: MutableRefObject<HTMLElement | null>;
overIndex: number;
over: Over | null;
setNodeRef: (node: HTMLElement | null) => void;
setActivatorNodeRef: (element: HTMLElement | null) => void;
setDroppableNodeRef: (element: HTMLElement | null) => void;
setDraggableNodeRef: (element: HTMLElement | null) => void;
transform: Transform | null;
transition: string | undefined;
}>;

export declare const BoardSortableNullColumn: ({ children }: BoardNullColumnProps) => JSX_2.Element;

export declare const useBoardActiveColumn: () => BoardColumnNode | undefined;

export declare const useBoardActiveItem: () => (BoardItemNode & {
    column: BoardColumnNode;
}) | undefined;

export declare const useBoardSortableNode: () => {
    active: Active | null;
    activeIndex: number;
    attributes: DraggableAttributes;
    data: SortableData & {
        [x: string]: any;
    };
    rect: MutableRefObject<ClientRect_2 | null>;
    index: number;
    newIndex: number;
    items: UniqueIdentifier[];
    isOver: boolean;
    isSorting: boolean;
    isDragging: boolean;
    listeners: SyntheticListenerMap | undefined;
    node: MutableRefObject<HTMLElement | null>;
    overIndex: number;
    over: Over | null;
    setNodeRef: (node: HTMLElement | null) => void;
    setActivatorNodeRef: (element: HTMLElement | null) => void;
    setDroppableNodeRef: (element: HTMLElement | null) => void;
    setDraggableNodeRef: (element: HTMLElement | null) => void;
    transform: Transform | null;
    transition: string | undefined;
};

export { }
