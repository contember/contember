import { assert, dataAttribute, isNonEmptyTrimmedString, useClassName } from '@contember/utilities'
import { memo, useId, useLayoutEffect, useRef } from 'react'
import slugify from 'slugify'
import { useActiveSlotPortalsContext, useTargetsRegistryContext } from './contexts'
import { TargetProps } from './types'

export type OwnTargetContainerProps = {
	'data-has-own-children': boolean;
	'data-name': string;
	className: string;
}

export const Target = memo<TargetProps>(
	({
		as,
		componentClassName = 'slot',
		className: classNameProp,
		children,
		name,
		...rest
	}) => {
		assert('name is non-empty string', name, isNonEmptyTrimmedString)

		const ref = useRef<HTMLElement>(null)
		const { unregisterSlotTarget, registerSlotTarget } = useTargetsRegistryContext()
		const activeSlotPortals = useActiveSlotPortalsContext()

		useLayoutEffect(() => {
			registerSlotTarget(name, ref)
			return () => unregisterSlotTarget(name)
		})

		const Container = as ?? 'div'
		const className = useClassName(componentClassName, classNameProp)
		const key = useId()

		return (activeSlotPortals?.has(name)
			? (
				<Container
					ref={ref}
					key={key}
					data-has-own-children={!!children}
					data-name={dataAttribute(slugify(name, { lower: true }))}
					className={className}
					{...rest}
				/>
			)
			: null
		)
	},
)
Target.displayName = 'Interface.Slots.Target'
