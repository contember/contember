import { useClassNameFactory } from '@contember/utilities'
import { forwardRef, memo, ReactNode } from 'react'
import type { BoxDistinction, Default, HTMLDivElementProps, Intent, Size } from '../../types'
import { toEnumViewClass, toStateClass, toThemeClass } from '../../utils'
import { Stack, StackProps } from '../Stack'
import { Label } from '../Typography/Label'

export interface BoxOwnProps {
	actions?: ReactNode
	children?: ReactNode
	distinction?: BoxDistinction
	direction?: StackProps['direction']
	gap?: Size | 'none'
	heading?: ReactNode
	isActive?: boolean
	intent?: Intent
	padding?: Default | 'no-padding' | 'with-padding'
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
	children,
	className,
	direction = 'vertical',
	distinction,
	gap = 'small',
	heading,
	intent,
	isActive,
	padding,
	...divProps
}: BoxProps, ref) => {
	const componentClassName = useClassNameFactory('box')

	return (
		<div
			{...divProps}
			className={componentClassName(null, [
				toStateClass('active', isActive),
				toEnumViewClass(distinction),
				toThemeClass(intent, intent),
				toEnumViewClass(padding),
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
