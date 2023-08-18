import { useClassName, useId, useReferentiallyStableValue } from '@contember/react-utils'
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

		aliases = aliases ?? [name]
		assert('aliases is non-empty string or array of non-empty strings', aliases, nonEmptyArrayOfNonEmptyStrings)

		const names = useReferentiallyStableValue(aliases)

		const ref = useRef<HTMLElement>(null)
		const instanceId = useRef(Math.random().toString(36).substring(2, 9)).current
		const { unregisterSlotTarget, registerSlotTarget } = useTargetsRegistryContext()
		const activeSlotPortals = useActiveSlotPortalsContext()

		useLayoutEffect(() => {
			names.forEach(name => {
				registerSlotTarget(instanceId, name, ref)
			})

			return () => {
				names.forEach(name => {
					unregisterSlotTarget(instanceId, name)
				})
			}
		}, [instanceId, names, registerSlotTarget, unregisterSlotTarget])

		const Container = as ?? 'div'
		const className = useClassName(componentClassName, classNameProp)
		const key = useId()

		const active = setHasOneOf(activeSlotPortals, names)

		return ((active || fallback)
			? (
				<Container
					ref={ref}
					key={key}
					{...rest}
					data-key={key}
					data-id={instanceId}
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
