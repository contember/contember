import { dataAttribute } from '@contember/utilities'
import { ElementType, memo, ReactNode, useMemo } from 'react'
import { useTargetElementRegistrar } from '../hooks'
import { useHasActiveSlotsFactory } from '../hooks'

export type OwnTargetContainerProps = {
	className: string;
}

export type SlotTargetProps =
	& {
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
	}

/**
 * @group Layout
 */
export const SlotTarget = memo<SlotTargetProps>(({
	as,
	aliases,
	className,
	display,
	fallback,
	name,
	...rest
}) => {
	const registerElement = useTargetElementRegistrar(name, aliases)

	const hasActiveSlots = useHasActiveSlotsFactory()
	const active = useMemo(() => {
		return hasActiveSlots(name, ...aliases ?? [])
	}, [aliases, hasActiveSlots, name])

	const Container = as ?? 'div'
	const style = useMemo(() => ({ display: display ?? (as === undefined ? 'contents' : undefined) }), [as, display])

	return ((active || fallback)
		? (
			<Container
				ref={registerElement}
				{...rest}
				style={style}
				data-display={dataAttribute(display ?? (as === undefined ? true : undefined))}
				data-fallback={dataAttribute(!!fallback)}
				data-name={dataAttribute(name)}
				className={className}
				children={active ? null : fallback}
			/>
		)
		: null
	)
})
SlotTarget.displayName = 'Layout.Slots.Target'
