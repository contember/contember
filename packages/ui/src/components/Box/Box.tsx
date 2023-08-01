import { useClassNameFactory, useColorScheme } from '@contember/react-utils'
import { colorSchemeClassName, dataAttribute, deprecate, fallback, isDefined, themeClassName } from '@contember/utilities'
import { ReactNode, forwardRef, memo } from 'react'
import type { BoxDistinction, Default, HTMLDivElementProps, Intent } from '../../types'
import { Stack, StackProps } from '../Stack'
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
	& BoxHeaderProps
	& Pick<StackProps, 'align' | 'className' | 'direction' | 'evenly' | 'gap' | 'horizontal' | 'justify' | 'reverse' | 'wrap'>
	& {
		background?: boolean
		border?: boolean
		borderRadius?: boolean | 'gap' | 'gutter' | 'padding' | 'large' | 'larger'
		children?: ReactNode
		/** @deprecated Use `background={false} border={false} padding={false}` props combination instead */
		distinction?: BoxDistinction
		footer?: ReactNode
		/** @deprecated Use `label` instead */
		heading?: ReactNode
		isActive?: boolean
		intent?: Intent
		padding?:
		| boolean | 'gap' | 'gutter' | 'padding' | 'large' | 'larger'
		| DeprecatedPaddingPropLiteral
	}

/** @deprecated Use `boolean` instead */
export type DeprecatedPaddingPropLiteral =
	| Default
	| 'no-padding'
	| 'with-padding'

export type BoxProps =
	& Omit<HTMLDivElementProps, keyof BoxOwnProps>
	& BoxOwnProps

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
 * @group UI
 */
export const Box = memo(forwardRef<HTMLDivElement, BoxProps>(({
	actions,
	align,
	background = true,
	border = true,
	borderRadius = true,
	children,
	className,
	direction,
	distinction,
	evenly,
	footer,
	gap = 'gutter',
	header,
	heading,
	horizontal,
	intent,
	isActive,
	label,
	justify,
	padding = true,
	reverse,
	wrap,
	...divProps
}: BoxProps, ref) => {
	const componentClassName = useClassNameFactory('box')

	// TODO: Remove in v1.3.0
	deprecate('1.3.0', padding === 'default', '`padding="default"`', 'omitted `padding` prop')
	padding = fallback(padding, padding === 'default', true)

	deprecate('1.3.0', padding === 'no-padding', '`padding="no-padding"`', '`padding={false}`')
	padding = fallback(padding, padding === 'no-padding', false)

	deprecate('1.3.0', padding === 'with-padding', '`padding="with-padding"`', '`padding={true}`')
	padding = fallback(padding, padding === 'with-padding', true)

	deprecate('1.3.0', isDefined(distinction), 'the `distinction` prop', '`background={false} border={false} padding={false}`')
	border = fallback(border, distinction === 'seamless', false)
	padding = fallback(padding, distinction === 'seamless', false)

	deprecate('1.3.0', heading !== undefined, '`heading` prop', '`label` prop')
	label = fallback(label, heading !== undefined, heading)

	return (
		<div
			{...divProps}
			data-active={dataAttribute(isActive)}
			data-background={dataAttribute(background)}
			data-border={dataAttribute(border)}
			data-border-radius={dataAttribute(borderRadius)}
			data-gap={dataAttribute(gap)}
			data-padding={dataAttribute(padding)}
			className={componentClassName(null, [
				...themeClassName(intent),
				colorSchemeClassName(useColorScheme()),
				className,
			])}
			ref={ref}
		>
			<Stack
				align={align}
				direction={direction}
				evenly={evenly}
				gap={gap}
				horizontal={horizontal}
				justify={justify}
				reverse={reverse}
			>
				{header
					? <div className={componentClassName('header')}>{header}</div>
					: (label || actions) && (
						<div className={componentClassName('header')}>
							{label && <Label>{label}</Label>}
							{actions && (
								<div className={componentClassName('actions')} contentEditable={false}>
									{actions}
								</div>
							)}
						</div>
				)}
				{children}
				{footer && <div className={componentClassName('footer')}>{footer}</div>}
			</Stack>
		</div>
	)
}))
Box.displayName = 'Box'
