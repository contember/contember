import { useClassNameFactory, useColorScheme } from '@contember/react-utils'
import { colorSchemeClassName, dataAttribute, deprecate, fallback, isDefined, themeClassName } from '@contember/utilities'
import { ReactNode, memo } from 'react'
import type { Default, HTMLDivElementProps, Intent, MessageDistinction, MessageFlow } from '../../types'

/** @deprecated Omit the prop instead */
export type DeprecatedMessageSize = Default

export interface MessageOwnProps {
	action?: ReactNode
	borderRadius?: boolean | 'gap' | 'gutter' | 'padding' | 'large' | 'larger'
	background?: boolean
	display?: 'inline' | 'block'
	elevated?: boolean
	children?: ReactNode
	icon?: ReactNode
	important?: boolean
	intent?: Intent
	padding?: boolean | 'gap' | 'gutter' | 'padding' | 'large' | 'larger'
	textAlign?: 'start' | 'center' | 'end'
	size?: 'small' | 'medium' | 'large'
}

/** @deprecated Use `MessageOwnProps` instead */
export type DeprecatedMessageProps = {
	/** @deprecated Use `elevated` instead */
	lifted?: boolean
	/** @deprecated Use `important` prop instead */
	distinction?: MessageDistinction
	/** @deprecated Use `padding` and `display` props instead */
	flow?: MessageFlow
	size?: MessageOwnProps['size'] | DeprecatedMessageSize
}

export type MessageProps =
	& Omit<HTMLDivElementProps, keyof MessageOwnProps | keyof DeprecatedMessageProps>
	& Omit<MessageOwnProps, keyof DeprecatedMessageProps>
	& DeprecatedMessageProps

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
	display = 'inline',
	distinction,
	elevated = false,
	flow,
	icon,
	important,
	intent = 'positive',
	lifted,
	padding,
	size,
	textAlign,
	...props
}: MessageProps) => {
	deprecate('1.3.0', isDefined(lifted), '`lifted` prop', '`elevated` prop')
	elevated = fallback(elevated, isDefined(lifted), lifted ?? false)

	deprecate('1.3.0', isDefined(flow), '`flow` prop', '`display` prop')
	display = fallback(display, flow === 'block' || flow === 'generousBlock', 'block')
	padding = fallback(padding, flow === 'generous' || flow === 'generousBlock', 'large')

	deprecate('1.3.0', isDefined(distinction), '`distinction` prop', 'combination of `important` and/or `padding` props')
	important = fallback(important, distinction === 'striking', true)
	padding = fallback(padding, distinction === 'striking', true)

	deprecate('1.3.0', size === 'default', '`size="default"` prop', 'omit `size` prop')
	size = fallback(size, size === 'default', undefined)

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
			<div className={componentClassName('content')}>{children}</div>
			{action && <div className={componentClassName('action')}>{action}</div>}
		</div>
	)
})
Message.displayName = 'Message'
