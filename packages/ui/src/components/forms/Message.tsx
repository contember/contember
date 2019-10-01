import cn from 'classnames'
import * as React from 'react'
import { MessageDistinction, MessageFlow, MessageType, Size } from '../../types'
import { toEnumViewClass, toViewClass } from '../../utils'

export interface MessageProps {
	type?: MessageType
	size?: Size
	flow?: MessageFlow
	distinction?: MessageDistinction
	lifted?: boolean
	children?: React.ReactNode
	action?: React.ReactNode
}

export const Message = React.memo(({ children, size, flow, distinction, type, lifted, action }: MessageProps) => (
	<div
		className={cn(
			'message',
			toEnumViewClass(size),
			toEnumViewClass(type),
			toEnumViewClass(distinction),
			toViewClass('lifted', lifted),
			toEnumViewClass(flow),
		)}
	>
		<div className="message-content">{children}</div>
		{action && <div className="message-action">{action}</div>}
	</div>
))
Message.displayName = 'Message'
