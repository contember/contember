import { Slots } from '@contember/layout'
import { useClassNameFactory } from '@contember/react-utils'
import { ComponentClassNameProps } from '@contember/utilities'
import { PropsWithChildren } from 'react'
import { SlotTargets } from './Slots'

const allSlotKeys = Object.keys(SlotTargets) as Array<keyof typeof SlotTargets>

export const LayoutComponent = ({ children, className: classNameProp, ...rest }: PropsWithChildren<ComponentClassNameProps>) => {
	const className = useClassNameFactory('test-layout')
	const targetsIfActive = Slots.useTargetsIfActiveFactory(SlotTargets)

	return (
		<div {...rest} className={className(null, classNameProp)} style={{
			backgroundColor: 'rgb(var(--cui-background-color--rgb-25))',
			color: 'rgb(var(--cui-color--rgb-50))',
			flexGrow: 1,
		}}>
			{targetsIfActive(allSlotKeys)}

			{children}
		</div>
	)
}
