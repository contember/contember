import { ComponentType } from 'react';
import { ElementType } from 'react';
import { FunctionComponentElement } from 'react';
import { NamedExoticComponent } from 'react';
import { ReactNode } from 'react';

export declare function createSlotComponents<K extends string>(slots: readonly K[]): SlotComponents<K>;

export declare function createSlotSourceComponent<T extends string>(slot: T): SlotSourceComponent<T>;

export declare function createSlotTargetComponent<T extends string>(name: T): SlotTargetComponent<T>;

export declare type OwnTargetContainerProps = {
    className: string;
};

export declare type SlotComponents<K extends string> = readonly [
readonly K[],
SlotSourceComponentsRecord<K>,
SlotTargetComponentsRecord<K>
];

/**
 * @group Layout
 */
export declare const SlotSource: NamedExoticComponent<SlotSourceProps>;

export declare type SlotSourceComponent<T extends string> = ComponentType<SlotSourceComponentProps> & {
    slot: T;
};

export declare type SlotSourceComponentProps = Omit<SlotSourceProps, 'name'>;

export declare type SlotSourceComponentsRecord<K extends string> = Readonly<{
    readonly [P in K]: SlotSourceComponent<P>;
}>;

export declare type SlotSourceProps = {
    children: ReactNode;
    name: string;
};

/**
 * @group Layout
 */
export declare const SlotsProvider: NamedExoticComponent<    {
children: ReactNode;
}>;

/**
 * @group Layout
 */
export declare const SlotTarget: NamedExoticComponent<    {
/**
* Type of the container element, default is `div`.
*
* In case you provide custom Element, mak sure to pass component wrapped in forwardRef
* otherwise the ref will not be passed to the container element and the slot will not work.
*
* @example
* ```
* <Target as={forwardRef((props, ref) => <h1 {...props} ref={ref} />)} />
* ```
*/
as?: ElementType;
/**
* Fallback of the target that is rendered when no source slot renders its content.
* Use `[data-fallback]` attribute to style the fallback.
*/
fallback?: ReactNode;
/**
* Name of the slot, similar to the `name` prop of the `Source` component.
*/
name: string;
/**
* Optional list of aliases for the slot.
*
* This is useful when one target element is sufficient for multiple slots sources.
* E.g. when you know that `Sidebar` and `SidebarBody` slot sources result in the same target.
*/
aliases?: [string, ...string[]];
/**
* Controls the display of the target element, default is 'contents'.
*/
display?: boolean | "contents" | "block" | "flex" | "grid" | "inline" | "inline-flex" | "inline-grid" | "inline-block" | "inherit" | "initial" | "none" | "unset";
className?: string;
}>;

export declare type SlotTargetComponent<T extends string> = ComponentType<SlotTargetComponentProps> & {
    slot: T;
};

export declare type SlotTargetComponentProps = Omit<SlotTargetProps, 'name'>;

export declare type SlotTargetComponentsRecord<K extends string> = Readonly<{
    readonly [P in K]: SlotTargetComponent<P>;
}>;

export declare type SlotTargetProps = {
    /**
     * Type of the container element, default is `div`.
     *
     * In case you provide custom Element, mak sure to pass component wrapped in forwardRef
     * otherwise the ref will not be passed to the container element and the slot will not work.
     *
     * @example
     * ```
     * <Target as={forwardRef((props, ref) => <h1 {...props} ref={ref} />)} />
     * ```
     */
    as?: ElementType;
    /**
     * Fallback of the target that is rendered when no source slot renders its content.
     * Use `[data-fallback]` attribute to style the fallback.
     */
    fallback?: ReactNode;
    /**
     * Name of the slot, similar to the `name` prop of the `Source` component.
     */
    name: string;
    /**
     * Optional list of aliases for the slot.
     *
     * This is useful when one target element is sufficient for multiple slots sources.
     * E.g. when you know that `Sidebar` and `SidebarBody` slot sources result in the same target.
     */
    aliases?: [string, ...string[]];
    /**
     * Controls the display of the target element, default is 'contents'.
     */
    display?: boolean | 'contents' | 'block' | 'flex' | 'grid' | 'inline' | 'inline-flex' | 'inline-grid' | 'inline-block' | 'inherit' | 'initial' | 'none' | 'unset';
    className?: string;
};

/**
 * Creates a function which returns true if any of the slots passed to it are active.
 */
export declare function useHasActiveSlotsFactory<T extends SlotTargetComponentsRecord<string>>(): (...slots: ReadonlyArray<keyof T & string>) => boolean;

/**
 * Returns the target element for the given slot name.
 * If there is no slots context, it returns `null`.
 * If the target is not present in the layout, it returns `undefined`.
 */
export declare const useSlotTargetElement: (name: string) => HTMLElement | null | undefined;

/**
 * Creates a function that returns a list of slot targets if any of them are active.
 * @param SlotTargets - List of slot targets to create
 */
export declare function useSlotTargetsFactory<R extends SlotTargetComponentsRecord<string>>(SlotTargets: R): <T>(slots: ReadonlyArray<keyof R & string>, override?: T) => NonNullable<T> | FunctionComponentElement<    {
children?: ReactNode | undefined;
}> | null;

/**
 * Returns a function that registers the given element as a target for the given slot name.
 * You should use it in the `ref` prop of the element you want to register.
 */
export declare const useTargetElementRegistrar: (name: string, aliases?: string[]) => ((element: HTMLElement | null) => void);

export { }
