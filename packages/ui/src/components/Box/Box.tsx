import { useClassNameFactory, useColorScheme } from '@contember/react-utils'
import { ComponentClassNameProps, colorSchemeClassName, dataAttribute, themeClassName } from '@contember/utilities'
import { ReactNode, forwardRef, memo } from 'react'
import type { HTMLDivElementProps, Intent } from '../../types'
import { Stack, StackOwnProps } from '../Stack'
import { Text } from '../Typography'
import { Label } from '../Typography/Label'

export type BoxHeaderProps =
	| {
		actions?: ReactNode
		header?: never
		label?: ReactNode
	}
	| {
		actions?: never
		header?: ReactNode
		label?: never
	}

export type BoxOwnProps =
	& ComponentClassNameProps
	& BoxHeaderProps
	& Pick<StackOwnProps, 'align' | 'evenly' | 'gap' | 'grow' | 'horizontal' | 'justify' | 'reverse' | 'shrink' | 'wrap'>
	& {
		background?: boolean
		border?: boolean
		borderRadius?: StackOwnProps['gap']
		children?: ReactNode
		fit?: false | 'width' | 'height' | 'both'
		focusRing?: boolean
		footer?: ReactNode
		isActive?: boolean
		intent?: Intent
		padding?: StackOwnProps['gap']
	}

export type BoxProps = Omit<HTMLDivElementProps, keyof BoxOwnProps> & BoxOwnProps

/**
 * The `Box` component is a container that can be used to wrap other components.
 *
 * @example
 * A basic box:
 * ```tsx
* <Box padding={false}>A box content</Box>
* <Box padding="gap">A box content</Box>
* <Box padding="gutter">A box content</Box>
* <Box padding="padding">A box content</Box>
 * ```
 *
 * @example
 * Box with various paddings without borders:
 * ```tsx
 * <Box border={false} padding={false}>A box content</Box>
 * <Box border={false} padding="gap">A box content</Box>
 * <Box border={false} padding="gutter">A box content</Box>
 * <Box border={false} padding="padding">A box content</Box>
 * ```
 *
 * @example
 * Box with label and delete action:
 * ```tsx
 * <Box label="Label" actions={<Button square borderRadius="full" distinction="seamless" intent="danger"><TrashIcon /></Button>}>A box content</Box>* ```
 * ```
 *
 * @example
 * Box with a custom header, content and footer:
 * ```tsx
 * <Box header={<h3>Header</h3>} footer={<Button display="block" distinction="primary">Continue</Button>}>
 * 	Lorem ipsum dolor sit amet
 * </Box>
 * ```
 *
 * @example
 * Box simulating a message input with a send button:
 * ```tsx
 * <Box horizontal focusRing padding="double" align="end">
 * 	<TextareaInput placeholder="Send new message..." minRows={1} maxRows={10} distinction="seamless" />
 * 	<Button>Send <SendHorizontalIcon /></Button>
 * </Box>
 * ```
 *
 * @group UI
 */
export const Box = memo(forwardRef<HTMLDivElement, BoxProps>(({
	actions,
	align,
	background = true,
	border = true,
	borderRadius = true,
	children,
	className: classNameProp,
	componentClassName = 'box',
	evenly,
	fit = 'width',
	focusRing,
	footer,
	gap = 'gutter',
	header,
	horizontal,
	intent,
	isActive,
	label,
	justify,
	padding = true,
	reverse,
	...rest
}: BoxProps, ref) => {
	const className = useClassNameFactory(componentClassName)

	return (
		<Stack
			{...rest}
			ref={ref}
			align={align}
			data-active={dataAttribute(isActive)}
			data-background={dataAttribute(background)}
			data-border={dataAttribute(border)}
			data-border-radius={dataAttribute(borderRadius)}
			data-focus-ring={dataAttribute(focusRing)}
			data-fit={dataAttribute(fit)}
			data-padding={dataAttribute(padding)}
			className={className(null, [
				...themeClassName(intent),
				colorSchemeClassName(useColorScheme()),
				classNameProp,
			])}
			gap={gap}
			horizontal={horizontal}
			justify={justify}
			reverse={reverse}
		>
			{header
				? <div className={className('header')}>{header}</div>
				: (label || actions) && (
					<div className={className('header')}>
						{(typeof label === 'string' || typeof label === 'number')
							? <Label>{label}</Label>
							: label
						}
						{actions && (
							<div className={className('actions')} contentEditable={false}>
								{actions}
							</div>
						)}
					</div>
				)}
			{children && (
				<Stack
					className={[className('body'), className('content')]}
					evenly={evenly}
					gap={gap}
					horizontal={horizontal}
					align={align}
					justify={justify}
				>
					{typeof children === 'string' || typeof children === 'number'
						? <Text>{children}</Text>
						: children
					}
				</Stack>
			)}
			{footer && <div className={className('footer')}>{footer}</div>}
		</Stack>
	)
}))
Box.displayName = 'Box'
