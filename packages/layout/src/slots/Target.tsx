import { useClassName, useId } from '@contember/react-utils'
import { assert, dataAttribute, isArrayOfMembersSatisfyingFactory, isNonEmptyArray, isNonEmptyTrimmedString, isSingleWordString, satisfiesOneOfFactory, setHasOneOf } from '@contember/utilities'
import { snakeCase } from 'change-case'
import { memo, useLayoutEffect, useRef } from 'react'
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
		fallback,
		name,
		...rest
	}) => {
		assert('name is non-empty string without spaces', name, isNameString)

		if (aliases) {
			assert('aliases is an empty array or an array of names', aliases, nonEmptyArrayOfNonEmptyStrings)
		}

		const ref = useRef<HTMLElement>(null)
		const idRef = useRef(Math.random().toString(36).substring(2, 9))
		const { unregisterSlotTarget, registerSlotTarget } = useTargetsRegistryContext()
		const activeSlotPortals = useActiveSlotPortalsContext()

		useLayoutEffect(() => {
			const id = idRef.current
			registerSlotTarget(id, name, ref)

			return () => {
				unregisterSlotTarget(id, name)
			}
		}, [name, registerSlotTarget, unregisterSlotTarget])

		const registeredAliasesRef = useRef<Set<string>>(new Set())

		useLayoutEffect(() => {
			const id = idRef.current

			if (aliases) {
				const aliasesSet = new Set(aliases)

				aliasesSet.forEach(name => {
					if (!registeredAliasesRef.current.has(name)) {
						registerSlotTarget(id, name, ref)
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

			const _registeredAliasesRef = registeredAliasesRef

			return () => {
				_registeredAliasesRef.current.forEach(name => {
					unregisterSlotTarget(id, name)
					_registeredAliasesRef.current.delete(name)
				})
			}
		}, [aliases, registerSlotTarget, unregisterSlotTarget])

		const Container = as ?? 'div'
		const className = useClassName(componentClassName, classNameProp)
		const key = useId()

		const active = setHasOneOf(activeSlotPortals, [name, ...aliases ?? []])

		return ((active || fallback)
			? (
				<Container
					ref={ref}
					key={key}
					{...rest}
					data-key={key}
					data-id={idRef.current}
					data-fallback={dataAttribute(!!fallback)}
					data-name={dataAttribute(snakeCase(name).replace(/_/g, '-'))}
					className={className}
					children={active ? null : fallback}
				/>
			)
			: null
		)
	},
)
Target.displayName = 'Layout.Slots.Target'
