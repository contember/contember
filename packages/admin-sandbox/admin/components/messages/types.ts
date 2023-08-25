import { ReactNode } from 'react'

export interface MessagesListItemProps {
	authorName: ReactNode
	createdAt: ReactNode
	message: ReactNode
	mine: boolean
}

export interface MessagesListItemLineProps {
	children: ReactNode
}

export interface NewMessageInputProps {
	placeholder?: string
	onSend: (message: string) => void
}
