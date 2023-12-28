import { useClassNameFactory, useColorScheme } from '@contember/react-utils'
import { colorSchemeClassName, dataAttribute, themeClassName } from '@contember/utilities'
import { ReactNode, memo } from 'react'
import type { HTMLDivElementProps, Intent } from '../../types'
import { StackOwnProps } from '../Stack'
import { Text } from '../Typography'

export interface MessageOwnProps {
	action?: ReactNode
	borderRadius?: StackOwnProps['gap']
	background?: boolean
	display?: 'inline' | 'block'
	elevated?: boolean
	children?: ReactNode
	icon?: ReactNode
	important?: boolean
	intent?: Intent
	padding?: StackOwnProps['gap']
	textAlign?: 'start' | 'center' | 'end'
	size?: 'small' | 'medium' | 'large'
}

export type MessageProps = Omit<HTMLDivElementProps, keyof MessageOwnProps> & MessageOwnProps

/**
 * Message is a component for displaying a short message to the user.
 *
 * @example
 * Intent variants:
 * ```tsx
 * <Message>Default intent: positive</Message>
 * <Message intent="default">Intent: default</Message>
 * <Message intent="positive">Intent: positive</Message>
 * <Message intent="success">Intent: negative</Message>
 * <Message intent="warn">Intent: warn</Message>
 * <Message intent="danger">Intent: danger</Message>
 * <Message intent="primary">Intent: primary</Message>
 * <Message intent="secondary">Intent: secondary</Message>
 * ```
 *
 * @example
 * Elevated message with action:
 * ```tsx
 * <Message
 * 	elevated
 * 	action={<Button borderRadius="padding">Click me</Button>}
 * 	icon={<CheckCircle2Icon />}
 * 	intent="success"
 * 	borderRadius="large"
 * >
 * 	Default
 * </Message>
 * ```
 *
 * @example
 * Important variant with semi-background background:
 * ```tsx
 * <Message important>Important</Message>
 * ```
 *
 * @example
 * Border radius variants:
 * ```tsx
 * <Message important intent="success" borderRadius={false}>No border radius</Message>
 * <Message important intent="success">Default</Message>
 * <Message important intent="success" borderRadius>Border radius</Message>
 * <Message important intent="success" borderRadius="gap">Border radius: gap</Message>
 * <Message important intent="success" borderRadius="gutter">Border radius: gutter</Message>
 * <Message important intent="success" borderRadius="padding">Border radius: padding</Message>
 * <Message important intent="success" borderRadius="large">Border radius: large</Message>
 * <Message important intent="success" borderRadius="larger">Border radius: larger</Message>
 * ```
 *
 * @example
 * Size variants:
 * ```tsx
 * <Message important size="small">Small</Message>
 * <Message important>Default</Message>
 * <Message important size="large">Large</Message>
 * ```
 *
 * @example
 * Padding variants:
 * ```tsx
 * <Message important padding>Padding</Message>
 * <Message important padding={false}>No padding</Message>
 * <Message important padding="gap">Padding: gap</Message>
 * <Message important padding="gutter">Padding: gutter</Message>
 * <Message important padding="padding">Padding: padding</Message>
 * <Message important padding="large">Padding: large</Message>
 * <Message important padding="larger">Padding: larger</Message>
 * ```
 *
 * @group UI
 */
export const Message = memo(({
	action,
	background,
	borderRadius = true,
	children,
	className,
	display = 'block',
	elevated = false,
	icon,
	important,
	intent = 'positive',
	padding,
	size,
	textAlign,
	...props
}: MessageProps) => {
	const componentClassName = useClassNameFactory('message')

	return (
		<div
			{...props}
			className={componentClassName(null, [
				...themeClassName(intent),
				colorSchemeClassName(useColorScheme()),
				className,
			])}
			data-background={dataAttribute(background ?? (elevated || important ? true : undefined))}
			data-border-radius={dataAttribute(borderRadius)}
			data-display={dataAttribute(display)}
			data-elevated={dataAttribute(elevated)}
			data-important={dataAttribute(important)}
			data-padding={dataAttribute(padding ?? (important || elevated ? true : undefined))}
			data-size={dataAttribute(size)}
			data-text-align={dataAttribute(textAlign)}
		>
			{icon && <div className={componentClassName('icon')}>{icon}</div>}
			<div className={componentClassName('content')}>
				{typeof children === 'string' || typeof children === 'number'
					? <Text>{children}</Text>
					: children
				}
			</div>
			{action && <div className={componentClassName('action')}>{action}</div>}
		</div>
	)
})
Message.displayName = 'Message'
