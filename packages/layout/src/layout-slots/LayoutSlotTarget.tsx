
import { useScopedConsoleRef } from '@contember/react-utils'
import { NestedClassName, assert, isNonEmptyTrimmedString, useClassName } from '@contember/utilities'
import { ElementType, memo, useLayoutEffect, useRef } from 'react'
import { useLayoutSlotRegistryContext } from './Contexts'

export type LayoutSlotTargetProps = {
	as?: ElementType;
	children?: never;
	className?: NestedClassName;
	componentClassName?: string;
	name: string;
}

export const LayoutSlotTarget = memo<LayoutSlotTargetProps>(
	({
		as,
		componentClassName = 'layout-slot',
		className,
		name,
		...rest
	}) => {
		assert('name is non-empty string', name, isNonEmptyTrimmedString)

		const scopedConsoleRef = useScopedConsoleRef(`LayoutSlotTarget`)

		const ref = useRef<HTMLElement>(null)
		const { registerLayoutSlot, unregisterLayoutSlot } = useLayoutSlotRegistryContext()

		useLayoutEffect(() => {
			scopedConsoleRef.current.warn(`useLayoutEffect(DEPENDENT)`, ref)
			scopedConsoleRef.current.log(`registerLayoutSlot(${name})`, registerLayoutSlot(name, ref))

			return () => unregisterLayoutSlot(name)
		}, [name, registerLayoutSlot, scopedConsoleRef, unregisterLayoutSlot])

		const Container = as ?? 'div'

		return (
			<Container
				ref={ref}
				id={`layout-slot-${name}`}
				className={useClassName([componentClassName, `layout-slot-${name}`], className)}
				{...rest}
			/>
		)
	},
)
LayoutSlotTarget.displayName = 'Layout.SlotTarget'
