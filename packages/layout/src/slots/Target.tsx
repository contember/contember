import { useClassName, useId } from '@contember/react-utils'
import {
	assert,
	dataAttribute,
	isArrayOfMembersSatisfyingFactory,
	isNonEmptyArray,
	isNonEmptyTrimmedString,
	isSingleWordString,
	satisfiesOneOfFactory,
	setHasOneOf,
} from '@contember/utilities'
import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useActiveSlotPortalsContext, useTargetsRegistryContext } from './contexts'
import { SlotTargetProps } from './types'

export type OwnTargetContainerProps = {
	className: string;
}

const isNameString = satisfiesOneOfFactory(
	isNonEmptyTrimmedString,
	isSingleWordString,
)

const nonEmptyArrayOfNonEmptyStrings = satisfiesOneOfFactory(
	isNonEmptyArray,
	isArrayOfMembersSatisfyingFactory(isNameString),
)

/**
 * @group Layout
 */
export const Target = memo<SlotTargetProps>(
	({
		as,
		aliases,
		componentClassName = 'slot',
		className: classNameProp,
		display,
		fallback,
		name,
		...rest
	}) => {
		assert('name is non-empty string without spaces', name, isNameString)

		if (aliases) {
			assert('aliases is an empty array or an array of names', aliases, nonEmptyArrayOfNonEmptyStrings)
		}

		const [element, setElement] = useState<HTMLElement | null>(null)
		const id = useId()
		const { unregisterSlotTarget, registerSlotTarget } = useTargetsRegistryContext()
		const activeSlotPortals = useActiveSlotPortalsContext()

		useLayoutEffect(() => {
			if (element) {
				registerSlotTarget(id, name, element)

				return () => {
					unregisterSlotTarget(id, name)
				}
			}
		}, [element, id, name, registerSlotTarget, unregisterSlotTarget])

		const registeredAliasesRef = useRef<Set<string>>(new Set())

		useLayoutEffect(() => {
			if (element && aliases) {
				const aliasesSet = new Set(aliases)

				aliasesSet.forEach(name => {
					if (!registeredAliasesRef.current.has(name)) {
						registerSlotTarget(id, name, element)
						registeredAliasesRef.current.add(name)
					}
				})

				registeredAliasesRef.current.forEach(name => {
					if (!aliasesSet.has(name)) {
						unregisterSlotTarget(id, name)
						registeredAliasesRef.current.delete(name)
					}
				})
			}
		}, [aliases, element, id, registerSlotTarget, unregisterSlotTarget])

		useEffect(() => {
			const registeredAliases = registeredAliasesRef.current

			return () => {
				registeredAliases.forEach(name => {
					unregisterSlotTarget(id, name)
					registeredAliases.delete(name)
				})
			}
		}, [id, unregisterSlotTarget])

		const Container = as ?? 'div'
		const className = useClassName(componentClassName, classNameProp)

		const active = setHasOneOf(activeSlotPortals, [name, ...aliases ?? []])

		return ((active || fallback)
			? (
				<Container
					ref={setElement}
					key={id}
					{...rest}
					data-display={dataAttribute(display ?? (as === undefined ? true : undefined))}
					data-id={id}
					data-fallback={dataAttribute(!!fallback)}
					data-name={dataAttribute(name)}
					className={className}
					children={active ? null : fallback}
				/>
			)
			: null
		)
	},
)
Target.displayName = 'Layout.Slots.Target'
