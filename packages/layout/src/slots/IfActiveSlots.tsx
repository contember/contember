import { PascalCase } from '@contember/utilities'
import equal from 'fast-deep-equal/es6/index.js'
import { ReactNode, createElement, memo } from 'react'
import { useActiveSlotPortalsContext } from './contexts'
import { createSlotTargetComponent } from './createSlotTargetComponent'

export type IfActiveProps<K extends string = string> =
	| {
		children: ReactNode;
		slots: K[];
	}
	| {
		children?: never;
		slots: K[];
	}

export const IfActive = memo<IfActiveProps>(
	({ children, slots }) => {
		const activeSlotPortals = useActiveSlotPortalsContext()

		return (
			slots.some(slot => activeSlotPortals.has(slot))
				? <>{children}</>
				: null
		)
	},
	(prevProps, nextProps) => equal(prevProps.slots, nextProps.slots) && prevProps.children === nextProps.children,
)
IfActive.displayName = 'Interface.Slots.IfActive'

export function createTargetsIfActiveComponent<K extends PascalCase<string>>(slotsMap: Record<K, ReturnType<typeof createSlotTargetComponent>>) {
	const IfActive = memo<IfActiveProps<K>>(
		({ children, slots }) => {
			const activeSlotPortals = useActiveSlotPortalsContext()
			const intersection = slots.filter(slot => activeSlotPortals.has(slot))

			return (
				intersection.length > 0
					? (
						children
							? <>{children}</>
							: <>
								{intersection.map(
									slotName => createElement(slotsMap[slotName], { key: slotName }),
								)}
							</>
					)
					: null
			)
		},
		(prevProps, nextProps) => equal(prevProps.slots, nextProps.slots) && prevProps.children === nextProps.children,
	)
	IfActive.displayName = 'Interface.Slots.IfActive'

	return IfActive
}
