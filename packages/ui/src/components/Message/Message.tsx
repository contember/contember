import cn from 'classnames'
import { memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import type { HTMLDivElementProps, Intent, MessageDistinction, MessageFlow, Size } from '../../types'
import { toEnumViewClass, toThemeClass, toViewClass } from '../../utils'

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
	const prefix = useClassNamePrefix()
	return (
		<div
			{...props}
			className={cn(
				`${prefix}message`,
				toThemeClass(intent, intent),
				toEnumViewClass(size),
				toEnumViewClass(distinction),
				toViewClass('lifted', lifted),
				toEnumViewClass(flow),
				className,
			)}
		>
			<div className={`${prefix}message-content`}>{children}</div>
			{action && <div className={`${prefix}message-action`}>{action}</div>}
		</div>
	)
})
Message.displayName = 'Message'
