import { Context } from 'react';
import { EntityAccessor } from '@contember/react-binding';
import { EntityListAccessor } from '@contember/react-binding';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { NamedExoticComponent } from 'react';
import { ReactElement } from 'react';
import { ReactNode } from 'react';
import { SugaredQualifiedEntityList } from '@contember/react-binding';
import { SugaredRelativeEntityList } from '@contember/react-binding';
import { SugaredRelativeSingleField } from '@contember/react-binding';

/**
 * @group Blocks and repeaters
 */
export declare const Repeater: NamedExoticComponent<RepeaterProps>;

export declare type RepeaterAddItemIndex = number | 'first' | 'last' | undefined;

export declare type RepeaterAddItemMethod = (index: RepeaterAddItemIndex, preprocess?: EntityAccessor.BatchUpdatesHandler) => void;

/**
 * A trigger component for adding an item to a repeater.
 *
 * ## Props {@link RepeaterAddItemTriggerProps}
 * - children, ?index, ?preprocess
 *
 * #### Example
 * ```tsx
 * <RepeaterAddItemTrigger index="first">
 *   <button>Add Item</button>
 * </RepeaterAddItemTrigger>
 * ```
 */
export declare const RepeaterAddItemTrigger: ({ children, index, preprocess, ...props }: RepeaterAddItemTriggerProps) => JSX_2.Element;

/**
 * Props for the {@link RepeaterAddItemTrigger} component.
 */
export declare interface RepeaterAddItemTriggerProps {
    /**
     * The button element to be rendered.
     */
    children: ReactElement;
    /**
     * The index at which to add the item.
     * Can be one of:
     * - number: Adds the item at the specified index.
     * - `'first'`: Adds the item at the beginning.
     * - undefined or `'last'`: Adds the item at the end.
     */
    index?: RepeaterAddItemIndex;
    /**
     * A function to preprocess the entity.
     */
    preprocess?: EntityAccessor.BatchUpdatesHandler;
}

/** @internal */
export declare const RepeaterCurrentEntityContext: Context<EntityAccessor>;

/**
 * Iterates over all entities in the repeater and renders the children for each entity.
 *
 * #### Example
 * ```tsx
 * <RepeaterEachItem>
 *     <div>
 *         <RepeaterRemoveItemTrigger>
 *             <button>Remove</button>
 *          </RepeaterRemoveItemTrigger>
 *          <Field name="title" />
 *     </div>
 * </RepeaterEachItem>
 * ```
 */
export declare const RepeaterEachItem: ({ children }: {
    children: ReactNode;
}) => JSX_2.Element;

/**
 * Renders the children only if the repeater is empty.
 *
 * #### Example
 * ```tsx
 * <RepeaterEmpty>
 *     <p>No items</p>
 * </RepeaterEmpty>
 * ```
 */
export declare const RepeaterEmpty: ({ children }: {
    children: ReactNode;
}) => JSX_2.Element | null;

/** @internal */
export declare const RepeaterEntityListAccessorContext: Context<EntityListAccessor>;

export declare type RepeaterMethods = {
    moveItem?: RepeaterMoveItemMethod;
    addItem: RepeaterAddItemMethod;
    removeItem: RepeaterRemoveItemMethod;
};

/** @internal */
export declare const RepeaterMethodsContext: Context<RepeaterMethods>;

export declare type RepeaterMoveItemIndex = number | 'first' | 'last' | 'previous' | 'next';

export declare type RepeaterMoveItemMethod = (entity: EntityAccessor, index: RepeaterMoveItemIndex) => void;

/**
 * A trigger component for moving a repeater item to a new index.
 *
 * ## Props {@link RepeaterMoveItemTriggerProps}
 * - children, index
 *
 * #### Example
 * ```tsx
 * <RepeaterMoveItemTrigger index={'previous'}>
 *   <button>Move Item Up</button>
 * </RepeaterMoveItemTrigger>
 * ```
 */
export declare const RepeaterMoveItemTrigger: ({ children, index, ...props }: RepeaterMoveItemTriggerProps) => JSX_2.Element;

/**
 * Props for the {@link RepeaterMoveItemTrigger} component.
 */
export declare interface RepeaterMoveItemTriggerProps {
    /**
     * The button element to render inside the trigger.
     */
    children: ReactElement;
    /**
     * The index to move the current item to.
     * Can be one of:
     * - number: Moves the item to the specified index.
     * - `'first'`: Moves the item to the beginning.
     * - `'last'`: Moves the item to the end.
     * - `'previous'`: Moves the item to the previous index.
     * - `'next'`: Moves the item to the next index.
     */
    index: RepeaterMoveItemIndex;
}

/**
 * Renders the children only if the repeater is not empty.
 *
 * #### Example
 * ```tsx
 * <RepeaterNotEmpty>
 *     <p>Items:</p>
 * 	   <RepeaterEachItem>
 * 	       ...
 * 	   </RepeaterEachItem>
 * </RepeaterNotEmpty>
 */
export declare const RepeaterNotEmpty: ({ children }: {
    children: ReactNode;
}) => JSX_2.Element | null;

/**
 * Props from {@link Repeater}
 */
export declare type RepeaterProps = RepeaterQualifiedProps | RepeaterRelativeProps;

export declare type RepeaterQualifiedProps = SugaredQualifiedEntityList & {
    children?: ReactNode;
    sortableBy?: SugaredRelativeSingleField['field'];
};

export declare type RepeaterRelativeProps = SugaredRelativeEntityList & {
    children?: ReactNode;
    sortableBy?: SugaredRelativeSingleField['field'];
};

export declare type RepeaterRemoveItemMethod = (entity: EntityAccessor) => void;

/**
 * A trigger component for removing a repeater item.
 *
 * ## Props {@link RepeaterRemoveItemTriggerProps}
 * - children
 *
 * #### Example
 * ```tsx
 * <RepeaterRemoveItemTrigger>
 *   <button>Remove Item</button>
 * </RepeaterRemoveItemTrigger>
 * ```
 */
export declare const RepeaterRemoveItemTrigger: ({ children, ...props }: RepeaterRemoveItemTriggerProps) => JSX_2.Element;

/**
 * Props for the {@link RepeaterRemoveItemTrigger} component.
 */
export declare interface RepeaterRemoveItemTriggerProps {
    /**
     * The button element to render inside the trigger.
     */
    children: ReactElement;
}

/** @internal */
export declare const RepeaterSortedEntitiesContext: Context<EntityAccessor[]>;

/**
 * Returns the current entity in the repeater from the context.
 */
export declare const useRepeaterCurrentEntity: () => EntityAccessor;

/**
 * Returns the entity list accessor of the repeater.
 */
export declare const useRepeaterEntityListAccessor: () => EntityListAccessor;

/**
 * Returns the methods (moveItem, addItem, removeItem) for manipulating the repeater.
 * {@link RepeaterMethods}
 */
export declare const useRepeaterMethods: () => RepeaterMethods;

/**
 * Returns the sorted entities of the repeater.
 */
export declare const useRepeaterSortedEntities: () => EntityAccessor[];

export { }
