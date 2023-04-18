
import { ElementType, memo, useLayoutEffect, useRef } from 'react'
import { assert, isNonEmptyTrimmedString } from '../assert-types'
import { NestedClassName, classNameForFactory } from '../class-name'
import { useScopedConsoleRef } from '../ui-debug-context'
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

		console.log('render', ref)

		useLayoutEffect(() => {
			scopedConsoleRef.current.warn(`useLayoutEffect(DEPENDENT)`, ref)
			scopedConsoleRef.current.log(`registerLayoutSlot(${name})`, registerLayoutSlot(name, ref))

			return () => unregisterLayoutSlot(name)
		}, [name, registerLayoutSlot, scopedConsoleRef, unregisterLayoutSlot])

		const Container = as ?? 'div'
		const classNameFor = classNameForFactory([componentClassName, `layout-slot-${name}`], className)

		return (
			<Container ref={ref} id={`layout-slot-${name}`} className={classNameFor()} {...rest} />
		)
	},
)
LayoutSlotTarget.displayName = 'Layout.SlotTarget'
