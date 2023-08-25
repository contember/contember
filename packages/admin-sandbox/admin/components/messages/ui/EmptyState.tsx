import { useClassName } from '@contember/react-utils'
import { Stack } from '@contember/ui'
import { ComponentClassNameProps } from '@contember/utilities'
import { MessagesSquareIcon } from 'lucide-react'
import { memo } from 'react'

export interface EmptyStateProps extends ComponentClassNameProps { }

export const EmptyState = memo<EmptyStateProps>(({
	className,
	componentClassName = 'messages-empty-state',
}) => (
	<Stack className={useClassName(componentClassName, className)} align="center" justify="center">
		<MessagesSquareIcon scale={4} strokeWidth="1" />
		<p>There are no messages here yet. Start by sending a new message</p>
	</Stack>
))
