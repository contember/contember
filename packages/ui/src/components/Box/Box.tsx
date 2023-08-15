import { useClassNameFactory, useColorScheme } from '@contember/react-utils'
import { ComponentClassNameProps, colorSchemeClassName, dataAttribute, deprecate, fallback, isDefined, themeClassName } from '@contember/utilities'
import { ReactNode, forwardRef, memo } from 'react'
import type { BoxDistinction, Default, HTMLDivElementProps, Intent } from '../../types'
import { DeprecatedStackProps, Stack, StackOwnProps } from '../Stack'
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

/** @deprecated Use `boolean` instead */
export type DeprecatedPaddingPropLiteral = Default | 'no-padding' | 'with-padding'

export type BoxOwnProps =
	& ComponentClassNameProps
	& BoxHeaderProps
	& Pick<StackOwnProps, 'align' | 'evenly' | 'gap' | 'horizontal' | 'justify' | 'reverse' | 'wrap'>
	& {
		background?: boolean
		border?: boolean
		borderRadius?: boolean | 'gap' | 'gutter' | 'padding' | 'large' | 'larger'
		children?: ReactNode
		fit?: false | 'width' | 'height' | 'both'
		footer?: ReactNode
		isActive?: boolean
		intent?: Intent
		padding?: boolean | 'gap' | 'gutter' | 'padding' | 'large' | 'larger'
	}

/** @deprecated Use `BoxOwnProps` instead */
export interface DeprecatedBoxProps extends Pick<DeprecatedStackProps, 'gap'> {
	/** @deprecated Use combination of `horizontal` and `reverse` props instead */
	direction?: DeprecatedStackProps['direction']
	/** @deprecated Use `background={false} border={false} padding={false}` props combination instead */
	distinction?: BoxDistinction
	/** @deprecated Use `label` instead */
	heading?: ReactNode
	padding?: BoxOwnProps['padding'] | DeprecatedPaddingPropLiteral
}

export type BoxProps =
	& Omit<HTMLDivElementProps, keyof BoxOwnProps | keyof DeprecatedBoxProps>
	& Omit<BoxOwnProps, keyof DeprecatedBoxProps>
	& DeprecatedBoxProps

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
	className: classNameProp,
	componentClassName = 'box',
	direction,
	distinction,
	evenly,
	fit = 'width',
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
	const className = useClassNameFactory(componentClassName)

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
		<Stack
			{...divProps}
			ref={ref}
			align={align}
			data-active={dataAttribute(isActive)}
			data-background={dataAttribute(background)}
			data-border={dataAttribute(border)}
			data-border-radius={dataAttribute(borderRadius)}
			data-fit={dataAttribute(fit)}
			data-padding={dataAttribute(padding)}
			className={className(null, [
				...themeClassName(intent),
				colorSchemeClassName(useColorScheme()),
				classNameProp,
			])}
			evenly={evenly}
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
			{children}
			{footer && <div className={className('footer')}>{footer}</div>}
		</Stack>
	)
}))
Box.displayName = 'Box'
