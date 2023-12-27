import { ComponentClassNameProps, PascalCase } from '@contember/utilities'
import { ComponentType, ElementType, ReactNode } from 'react'
import { createSlotSourceComponent } from './createSlotSourceComponent'
import { createSlotTargetComponent } from './createSlotTargetComponent'

/** @deprecated No alternative since 1.4.0 */
export type SlotComponentsRecords<K extends string> = Readonly<{
	readonly [P in PascalCase<K>]: ComponentType
}>

export type SlotSourceComponentsRecord<K extends string> = Readonly<{
	readonly [P in PascalCase<K>]: ReturnType<typeof createSlotSourceComponent<P>>
}>

export type SlotTargetComponentsRecord<K extends string> = Readonly<{
	readonly [P in PascalCase<K>]: ReturnType<typeof createSlotTargetComponent<P>>
}>

export type SlotSourceProps<K extends string = string> = {
	children: ReactNode;
	name: K;
}

export type SlotTargetProps<Name extends string = string> = ComponentClassNameProps & {
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
	name: Name;
	/**
	 * Optional list of aliases for the slot.
	 *
	 * This is useful when one target element is sufficient for multiple slots sources.
	 * E.g. when you know that `Sidebar` and `SidebarBody` slot sources result in the same target.
	 */
	aliases?: [Name, ...Name[]];
	/**
	 * Controls the display of the target element, default is 'contents'.
	 */
	display?: boolean | 'contents' | 'block' | 'flex' | 'grid' | 'inline' | 'inline-flex' | 'inline-grid' | 'inline-block' | 'inherit' | 'initial' | 'none' | 'unset';
}
