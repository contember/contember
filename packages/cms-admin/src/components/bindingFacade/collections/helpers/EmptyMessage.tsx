import { Box, Message } from '@contember/ui'
import * as React from 'react'

export interface EmptyMessageProps {
	children: React.ReactNode
}

export const EmptyMessage = React.memo((props: EmptyMessageProps) => {
	return (
		<Box>
			<Message flow="generousBlock">{props.children}</Message>
		</Box>
	)
})
EmptyMessage.displayName = 'EmptyMessage'
