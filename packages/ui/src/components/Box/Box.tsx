import { useClassNameFactory, useColorScheme } from '@contember/react-utils'
import { colorSchemeClassName, currentOrDeprecated, dataAttribute, deprecate, isDefined, themeClassName } from '@contember/utilities'
import { ReactNode, forwardRef, memo } from 'react'
import type { BoxDistinction, Default, HTMLDivElementProps, Intent, Size } from '../../types'
import { toEnumViewClass, toStateClass } from '../../utils'
import { Stack, StackProps } from '../Stack'
import { Label } from '../Typography/Label'

export type BoxOwnProps = {
	actions?: ReactNode
	background?: boolean
	border?: boolean
	children?: ReactNode
	/** @deprecated Use `background={false} border={false} padding={false}` props combination instead */
	distinction?: BoxDistinction
	direction?: StackProps['direction']
	gap?: Size | 'none'
	heading?: ReactNode
	isActive?: boolean
	intent?: Intent
	padding?:
	| boolean
	| DeprecatedPaddingPropLiteral
}

/** @deprecated Use `boolean` instead */
export type DeprecatedPaddingPropLiteral =
	| Default
	| 'no-padding'
	| 'with-padding'

// TODO: Remove in v1.3.0
function mapDeprecatedPadding(padding: BoxOwnProps['padding'], distinction: BoxOwnProps['distinction']): boolean | undefined {
	if (padding === 'with-padding') {
		return true
	} else if (padding === 'no-padding') {
		return false
	} else if (padding === 'default') {
		return true
	} else if (padding === undefined) {
		return distinction === 'seamless' ? false : undefined
	} else {
		return undefined
	}
}

export type BoxProps =
	& BoxOwnProps
	& HTMLDivElementProps

/**
 * The `Box` component is a container that can be used to wrap other components.
 *
 * @example
 * ```
 * <Box />
 * ```
 *
 * @group UI
 */
export const Box = memo(forwardRef<HTMLDivElement, BoxProps>(({
	actions,
	border = true,
	background = true,
	children,
	className,
	direction = 'vertical',
	distinction,
	gap = 'small',
	heading,
	intent,
	isActive,
	padding = true,
	...divProps
}: BoxProps, ref) => {
	const componentClassName = useClassNameFactory('box')

	deprecate('v1.3.0', typeof padding === 'boolean', `non-boolean \`padding\` prop value ${JSON.stringify(padding)}`, 'boolean `padding` prop values')
	deprecate('v1.3.0', !isDefined(distinction), 'the `distinction` prop', '`background={false} border={false} padding={false}`')

	// TODO: Remove in v1.3.0
	border = currentOrDeprecated(border, typeof distinction !== 'undefined'
		? distinction === 'seamless' ? false : true
		: undefined,
	) ?? true
	padding = currentOrDeprecated(padding, mapDeprecatedPadding(padding, distinction)) ?? true

	return (
		<div
			{...divProps}
			data-background={dataAttribute(background)}
			data-border={dataAttribute(border)}
			data-padding={dataAttribute(padding)}
			className={componentClassName(null, [
				toStateClass('active', isActive),
				...themeClassName(intent),
				colorSchemeClassName(useColorScheme()),
				className,
			])}
			ref={ref}
		>
			<Stack gap={gap} direction={direction}>
				{(heading || actions) && (
					<div className={componentClassName('header')}>
						{heading && <Label>{heading}</Label>}
						{actions && (
							<div className={componentClassName('actions')} contentEditable={false}>
								{actions}
							</div>
						)}
					</div>
				)}
				{children}
			</Stack>
		</div>
	)
}))
Box.displayName = 'Box'
