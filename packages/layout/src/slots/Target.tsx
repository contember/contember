import { useClassName, useId } from '@contember/react-utils'
import { assert, dataAttribute, isNonEmptyTrimmedString } from '@contember/utilities'
import { memo, useLayoutEffect, useRef } from 'react'
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
		const instanceId = useRef(Math.random().toString(36).substring(2, 9)).current
		const { unregisterSlotTarget, registerSlotTarget } = useTargetsRegistryContext()
		const activeSlotPortals = useActiveSlotPortalsContext()

		useLayoutEffect(() => {
			registerSlotTarget(instanceId, name, ref)
			return () => unregisterSlotTarget(instanceId, name)
		}, [instanceId, name, registerSlotTarget, unregisterSlotTarget])

		const Container = as ?? 'div'
		const className = useClassName(componentClassName, classNameProp)
		const key = useId()

		return (activeSlotPortals?.has(name)
			? (
				<Container
					ref={ref}
					key={key}
					data-key={key}
					data-id={instanceId}
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
