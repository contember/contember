import { Message } from '@contember/ui'
import * as React from 'react'

export interface EmptyMessageProps {
	children: React.ReactNode
}

export const EmptyMessage = React.memo((props: EmptyMessageProps) => (
	<Message flow="generousBlock">{props.children}</Message>
))
EmptyMessage.displayName = 'EmptyMessage'
