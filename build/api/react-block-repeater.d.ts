import { Context } from 'react';
import { EntityAccessor } from '@contember/react-binding';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { NamedExoticComponent } from 'react';
import { ReactElement } from 'react';
import { ReactNode } from 'react';
import { RepeaterAddItemIndex } from '@contember/react-repeater';
import { RepeaterProps } from '@contember/react-repeater';
import { SugaredRelativeSingleField } from '@contember/react-binding';

/**
 * Represents individual blocks within a block repeater.
 *
 * ## Props {@link BlockProps}
 * - name, children, ?label, ?form
 *
 * #### Example
 * ```tsx
 * <Block name="text" label="Text">
 *     <Field field="content" />
 * </Block>
 * ```
 */
export declare const Block: NamedExoticComponent<BlockProps>;

/**
 * Props for the {@link Block} component.
 */
export declare interface BlockProps {
    /**
     * The content of the block.
     */
    children: ReactNode;
    /**
     * Identifier of the block.
     */
    name: string;
    /**
     * Optional label for the block.
     */
    label?: ReactNode;
    /**
     * Optional form for the block.
     */
    form?: ReactNode;
}

/**
 * A repeater component that renders different blocks based on the value of a discrimination field.
 * This is headless component that does not impose any UI. Check DefaultBlockRepeater in UI library for a styled version.
 *
 * ## Props {@link BlockRepeaterProps}
 * - field or entities, sortableBy, discriminationField, children
 *
 * #### Example
 * ```tsx
 * <BlockRepeater field="blocks" discriminationField="type" sortableBy="order">
 *     <Block name="text" label="Text">
 *         <Field field="content" />
 *     </Block>
 *     <Block name="image" label="Image">
 *         <ImageField field="image" />
 *     </Block>
 * </BlockRepeater>
 * ```
 */
export declare const BlockRepeater: NamedExoticComponent<BlockRepeaterProps>;

/**
 * A trigger component for adding item of given type to a block repeater.
 *
 * ## Props {@link BlockRepeaterAddItemTriggerProps}
 * - type, ?index, ?preprocess, children
 *
 * #### Example
 * ```tsx
 * <BlockRepeaterAddItemTrigger type="image" index="first">
 *     <button>Add Image</button>
 * </BlockRepeaterAddItemTrigger>
 * ```
 */
export declare const BlockRepeaterAddItemTrigger: ({ preprocess, index, type, ...props }: BlockRepeaterAddItemTriggerProps) => JSX_2.Element;

/**
 * Props for the {@link BlockRepeaterAddItemTrigger} component.
 */
export declare interface BlockRepeaterAddItemTriggerProps {
    /**
     * The type of the item to add.
     */
    type: string;
    /**
     * The index at which to add the item.
     * Can be one of:
     *  - number: Adds the item at the specified index.
     *  - `'first'`: Adds the item at the beginning.
     *  - undefined or `'last'`: Adds the item at the end.
     */
    index?: RepeaterAddItemIndex;
    /**
     * A function to preprocess the entity.
     */
    preprocess?: EntityAccessor.BatchUpdatesHandler;
    /**
     * The button element.
     */
    children: ReactElement;
}

/** @internal */
export declare const BlockRepeaterConfigContext: Context<    {
discriminatedBy: SugaredRelativeSingleField["field"];
blocks: BlocksMap;
}>;

/**
 * Props for the {@link BlockRepeater} component.
 */
export declare type BlockRepeaterProps = {
    /**
     * A field that is used to determine the order of the entities.
     */
    sortableBy: RepeaterProps['sortableBy'];
    /**
     * Discrimination field is a field that is used to determine which block should be rendered for a given entity.
     */
    discriminationField: SugaredRelativeSingleField['field'];
} & RepeaterProps;

export declare type BlocksMap = Record<string, BlockProps>;

/**
 * Returns configuration of the block repeater (discrimination field and blocks map).
 */
export declare const useBlockRepeaterConfig: () => {
    discriminatedBy: SugaredRelativeSingleField["field"];
    blocks: BlocksMap;
};

/**
 * Returns the current block props (see {@link BlockProps}).
 */
export declare const useBlockRepeaterCurrentBlock: () => BlockProps | undefined;

export { }
