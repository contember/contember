import { ComponentClassNameProps, PascalCase } from '@contember/utilities'
import { ComponentType, ElementType, ReactNode } from 'react'
import { createSlotSourceComponent } from './createSlotSourceComponent'
import { createSlotTargetComponent } from './createSlotTargetComponent'

export type SlotComponentsRecords<K extends string> = Readonly<{
	readonly [P in PascalCase<K>]: ComponentType
}>

export type SlotSourceComponentsRecord<K extends string> = Readonly<{
	readonly [P in PascalCase<K>]: ReturnType<typeof createSlotSourceComponent<P>>
}>

export type SlotTargetComponentsRecord<K extends string> = Readonly<{
	readonly [P in PascalCase<K>]: ReturnType<typeof createSlotTargetComponent<P>>
}>

export type SourcePortalProps<K extends string = string> = {
	children: ReactNode;
	name: K;
}

export type TargetProps<Name extends string = string> = ComponentClassNameProps & {
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
	children?: ReactNode;
	name: Name;
}

