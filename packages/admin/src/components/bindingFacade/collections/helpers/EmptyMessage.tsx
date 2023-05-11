import { Box, BoxProps, Stack } from '@contember/ui'
import { ComponentType, memo, ReactNode } from 'react'

export interface EmptyMessageOuterProps {
	emptyMessage?: ReactNode
	emptyMessageComponent?: ComponentType<EmptyMessageComponentProps>
}

export interface EmptyMessageProps {
	children: ReactNode
	component?: ComponentType<EmptyMessageComponentProps>
	distinction?: BoxProps['distinction']
}

export interface EmptyMessageComponentProps {
	children: ReactNode
	distinction?: BoxProps['distinction']
}

/**
 * @group UI
 */
export const EmptyMessage = memo(({ children, component, distinction }: EmptyMessageProps) => {
	const MessageComponent = component ?? EmptyMessageDefault
	return <MessageComponent distinction={distinction}>{children}</MessageComponent>
})
EmptyMessage.displayName = 'EmptyMessage'

const EmptyMessageDefault = memo(({ children, distinction }: EmptyMessageComponentProps) => (
	<Box distinction={distinction} intent="default" padding="with-padding">
		<Stack direction="horizontal" justify="space-around">
			{children}
		</Stack>
	</Box>
))
