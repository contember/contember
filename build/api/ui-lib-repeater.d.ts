import { ClassAttributes } from 'react';
import { ForwardRefExoticComponent } from 'react';
import { HTMLAttributes } from 'react';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { NamedExoticComponent } from 'react';
import { ReactNode } from 'react';
import { RefAttributes } from 'react';
import { RepeaterAddItemIndex } from '@contember/react-repeater';
import { RepeaterProps } from '@contember/react-repeater';

/**
 * Props {@link DefaultRepeaterProps}.
 *
 * DefaultRepeater is a wrapper around Repeater that provides a default UI for a list of items.
 *
 * #### Example
 * ```tsx
 * <DefaultRepeater entities="RepeaterItem" sortableBy="order" title="Foo items" addButtonPosition="around">
 * 	<InputField field="title" />
 * 	<RepeaterItemActions>
 * 		<RepeaterRemoveItemButton />
 * 	</RepeaterItemActions>
 * </DefaultRepeater>
 * ```
 */
export declare const DefaultRepeater: NamedExoticComponent<DefaultRepeaterProps>;

/**
 * Props for the {@link DefaultRepeater} component.
 */
export declare type DefaultRepeaterProps = {
    /**
     * Optional repeater title.
     */
    title?: ReactNode;
    /**
     * Optional position of the add button.
     */
    addButtonPosition?: 'none' | 'after' | 'before' | 'around';
    /**
     * Optional label of the add button.
     */
    addButtonLabel?: ReactNode;
} & RepeaterProps;

/**
 * Props {@link RepeaterAddItemButtonProps}
 *
 * `RepeaterAddItemButton` is a button that adds a new item to a repeater at a specified index.
 * It wraps the `RepeaterAddItemTrigger` and displays customizable content.
 * By default, it shows a plus icon alongside a localized label.
 */
export declare const RepeaterAddItemButton: ({ children, index }: RepeaterAddItemButtonProps) => JSX_2.Element;

/**
 * Props for the {@link RepeaterAddItemButton} component.
 */
export declare type RepeaterAddItemButtonProps = {
    /**
     * The children to be rendered inside the button.
     */
    children?: React.ReactNode;
    /**
     * The index of the item to be added.
     */
    index?: RepeaterAddItemIndex;
};

/**
 * Props {@link RepeaterDropIndicatorProps}
 *
 * `RepeaterDropIndicator` is a visual indicator for sortable repeater items,
 * showing where an item will be dropped. It adapts its placement based on the `position` prop.
 */
export declare const RepeaterDropIndicator: ({ position }: RepeaterDropIndicatorProps) => JSX_2.Element;

/**
 * Props for the {@link RepeaterDropIndicator} component.
 */
export declare type RepeaterDropIndicatorProps = {
    /**
     * The position of drop indicator
     */
    position: 'before' | 'after';
};

/**
 * A container for actions that can be performed on a repeater item. Placed in the top right corner of the item.
 */
export declare const RepeaterItemActions: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLDivElement>>;

/**
 * Props see {@link RepeaterRemoveItemButtonProps}
 *
 * `RepeaterRemoveItemButton` is a button that removes an item from a repeater.
 * It wraps the {@link RepeaterRemoveItemTrigger} and displays a customizable child element.
 * By default, it shows a trash icon that turns red on hover.
 */
export declare const RepeaterRemoveItemButton: ({ children }: RepeaterRemoveItemButtonProps) => JSX_2.Element;

/**
 * `RepeaterRemoveItemButtonProps` is a type that defines the props for the `RepeaterRemoveItemButton` component.
 * It includes an optional `children` prop that can be used to customize the content of the button.
 */
export declare type RepeaterRemoveItemButtonProps = {
    children?: ReactNode;
};

export { }
