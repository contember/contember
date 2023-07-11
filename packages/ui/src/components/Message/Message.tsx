import { useClassNameFactory, useColorScheme } from '@contember/react-utils'
import { colorSchemeClassName, themeClassName } from '@contember/utilities'
import { ReactNode, memo } from 'react'
import type { HTMLDivElementProps, Intent, MessageDistinction, MessageFlow, Size } from '../../types'
import { toEnumViewClass, toViewClass } from '../../utils'

export type MessageProps =
	& {
		intent?: Intent
		type?: 'prop is deprecated, use intent'
		size?: Size
		flow?: MessageFlow
		distinction?: MessageDistinction
		lifted?: boolean
		children?: ReactNode
		action?: ReactNode
	}
	& HTMLDivElementProps

/**
 * @group UI
 */
export const Message = memo(({ className, children, intent, size, flow, distinction, type, lifted, action, ...props }: MessageProps) => {
	const componentClassName = useClassNameFactory('message')
	return (
		<div
			{...props}
			className={componentClassName(null, [
				...themeClassName(intent),
				colorSchemeClassName(useColorScheme()),
				toEnumViewClass(size),
				toEnumViewClass(distinction),
				toViewClass('lifted', lifted),
				toEnumViewClass(flow),
				className,
			])}
		>
			<div className={componentClassName('content')}>{children}</div>
			{action && <div className={componentClassName('action')}>{action}</div>}
		</div>
	)
})
Message.displayName = 'Message'
