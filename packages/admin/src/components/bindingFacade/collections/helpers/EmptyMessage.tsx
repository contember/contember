import { Message } from '@contember/ui'
import { ComponentType, memo, ReactNode } from 'react'

export interface EmptyMessageOuterProps {
	emptyMessage?: ReactNode
	emptyMessageComponent?: ComponentType<EmptyMessageComponentProps>
}

export interface EmptyMessageProps {
	children: ReactNode
	component?: ComponentType<EmptyMessageComponentProps>
}

export interface EmptyMessageComponentProps {
	children: ReactNode
}

export const EmptyMessage = memo(({ children, component }: EmptyMessageProps) => {
	const MessageComponent = component ?? EmptyMessageDefault
	return <MessageComponent>{children}</MessageComponent>
})
EmptyMessage.displayName = 'EmptyMessage'

const EmptyMessageDefault = memo((props: EmptyMessageComponentProps) => (
	<Message flow="generousBlock">{props.children}</Message>
))
