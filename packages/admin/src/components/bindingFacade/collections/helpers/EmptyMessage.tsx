import { Box, BoxProps, Stack } from '@contember/ui'
import { ComponentProps, ComponentType, ElementType, ReactNode, memo } from 'react'

export interface EmptyMessageOuterProps {
	emptyMessage?: ReactNode
	emptyMessageComponent?: ComponentType<EmptyMessageComponentProps>
}

export type EmptyMessageProps<C extends ElementType =
	& ComponentType<EmptyMessageComponentProps>> = ComponentProps<C>
	& ComponentProps<C>
	& {
		children: ReactNode
		component?: C
	}

export interface EmptyMessageComponentProps extends BoxProps {
	children: ReactNode
}

/**
 * @group UI
 */
export const EmptyMessage = memo(({ children, component, distinction, ...rest }: EmptyMessageProps) => {
	const MessageComponent = component ?? EmptyMessageDefault
	return <MessageComponent distinction={distinction} {...rest}>{children}</MessageComponent>
})
EmptyMessage.displayName = 'EmptyMessage'

const EmptyMessageDefault = memo(({ children, distinction, ...rest }: EmptyMessageComponentProps) => (
	<Box {...rest} distinction={distinction} intent="default" padding="with-padding">
		<Stack direction="horizontal" justify="space-around">
			{children}
		</Stack>
	</Box>
))
