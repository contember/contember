import { Message } from '@contember/ui'
import { memo, ReactNode } from 'react'

export interface EmptyMessageProps {
	children: ReactNode
}

export const EmptyMessage = memo((props: EmptyMessageProps) => <Message flow="generousBlock">{props.children}</Message>)
EmptyMessage.displayName = 'EmptyMessage'
