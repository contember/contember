import { Active } from '@dnd-kit/core';
import { ClientRect as ClientRect_2 } from '@dnd-kit/core';
import { Context } from 'react';
import { DndContextProps } from '@dnd-kit/core';
import { DraggableAttributes } from '@dnd-kit/core';
import { EntityAccessor } from '@contember/react-binding';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { MutableRefObject } from 'react';
import { Over } from '@dnd-kit/core';
import { default as React_2 } from 'react';
import { ReactElement } from 'react';
import { ReactNode } from 'react';
import { SortableData } from '@dnd-kit/sortable';
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { Transform } from '@dnd-kit/utilities';
import { UniqueIdentifier } from '@dnd-kit/core';

/** @internal */
export declare const RepeaterActiveEntityContext: Context<EntityAccessor | undefined>;

/**
 * Initializes dnd-kit based sorting for the repeater.
 * Using the props, you can customize the behavior of the sorting and hook into the drag events.
 *
 * #### Example
 * ```tsx
 * <Repeater {...}>
 *   <RepeaterSortable>
 *     <RepeaterSortableEachItem>
 *       <div>
 *         <RepeaterSortableDropIndicator position={'before'}><div>Drop here</div></RepeaterSortableDropIndicator>
 *         <RepeaterSortableItemNode>
 *           <div>
 *             <RepeaterSortableItemActivator>
 *               <span/>
 *             </RepeaterSortableItemActivator>
 *             {children}
 *           </div>
 *         </RepeaterSortableItemNode>
 *         <RepeaterSortableDropIndicator position={'afer'}><div>Drop here</div></RepeaterSortableDropIndicator>
 *       </div>
 *     </RepeaterSortableEachItem>
 *     <RepeaterSortableDragOverlay>
 *       <div>
 *         {children}
 *       </div>
 *     </RepeaterSortableDragOverlay>
 *   </RepeaterSortable>
 * </Repeater>
 * ```
 */
export declare const RepeaterSortable: ({ children, onDragStart, onDragEnd: onDragEndIn, onDragCancel: onDragCancelIn, ...props }: {
    children: ReactNode;
} & DndContextProps) => JSX_2.Element;

/**
 * Component for rendering the repeater item being dragged.
 */
export declare const RepeaterSortableDragOverlay: ({ children }: {
    children: ReactNode;
}) => JSX_2.Element | null;

/**
 * Renders a child element when the repeater item is being dragged over the drop indicator.
 */
export declare const RepeaterSortableDropIndicator: ({ children, position }: {
    children: ReactNode;
    position: "before" | "after";
}) => JSX_2.Element | null;

/**
 * Iterates over all entities in the repeater and renders the children for each entity.
 * Also sets up the dnd-kit sortable context for the repeater items.
 */
export declare const RepeaterSortableEachItem: ({ children }: {
    children: ReactNode;
}) => JSX_2.Element;

/**
 * Slot for the repeater item activator, which is the element that triggers the drag and drop interaction (e.g. a handle).
 */
export declare const RepeaterSortableItemActivator: React_2.ForwardRefExoticComponent<{
    children: ReactElement;
} & React_2.RefAttributes<HTMLElement>>;

/** @internal */
export declare const RepeaterSortableItemContext: Context<    {
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

/**
 * Slot for the repeater item node, which is the element that is being dragged.
 */
export declare const RepeaterSortableItemNode: ({ children }: {
    children: ReactElement;
}) => JSX_2.Element;

/**
 * Returns the entity that is currently being dragged in the repeater.
 */
export declare const useRepeaterActiveEntity: () => EntityAccessor | undefined;

/**
 * Returns the sortable context from dnd-kit (e.g. isDragging, isOver, setNodeRef) for the repeater item.
 */
export declare const useRepeaterSortableItem: () => {
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


export * from "@contember/react-repeater";

export { }
