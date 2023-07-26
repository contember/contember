import { useClassNameFactory } from '@contember/react-utils'
import { CSSProperties, ReactNode, forwardRef, memo, useMemo } from 'react'
import type { HTMLDivElementProps, Size } from '../../types'
import { toEnumClass, toEnumViewClass, toStateClass, toViewClass } from '../../utils'

export interface StackOwnProps {
	align?: 'center' | 'stretch' | 'start' | 'end',
	basis?: CSSProperties['flexBasis'],
	children?: ReactNode,
	direction: 'vertical' | 'horizontal' | 'vertical-reverse' | 'horizontal-reverse',
	evenly?: boolean,
	gap?: Size | 'xlarge' | 'none',
	grow?: boolean | CSSProperties['flexGrow'],
	justify?:
	| 'center'
	| 'start'
	| 'end'
	| 'space-between'
	| 'space-around'
	| 'space-evenly'
	| 'stretch'
	| 'inherit'
	| 'initial'
	| 'revert'
	shrink?: boolean | CSSProperties['flexShrink'],
	style?: CSSProperties,
	wrap?: boolean | 'reverse',
}

export type StackProps =
	& StackOwnProps
	& HTMLDivElementProps

/**
 * The `Stack` components allows you to stack any content vertically or horizontally.
 *
 * @example
 * ```
 * <Stack direction="horizontal" />
 * ```
 *
 * @group UI
 */
export const Stack = memo(forwardRef<HTMLDivElement, StackProps>(({
	align,
	basis,
	evenly,
	children,
	className,
	direction,
	gap,
	grow,
	justify,
	shrink,
	style: styleProp,
	wrap,
	...rest
}: StackProps, ref) => {
	deprecate('1.3.0', gap !== 'none', '`size="none"`', '`gap="gap"`')
	gap = currentOrDeprecated(gap, gap === 'none' ? gap : undefined, false)
	deprecate('1.3.0', gap !== 'small', '`size="small"`', '`gap="gap"`')
	gap = currentOrDeprecated(gap, gap === 'small' ? gap : undefined, 'gap')
	deprecate('1.3.0', gap !== 'xlarge', '`size="xlarge"`', '`gap="larger"`')
	gap = currentOrDeprecated(gap, gap === 'xlarge' ? gap : undefined, 'large')
	deprecate('1.3.0', gap !== 'default', '`size="default"`', 'omit the `gap` prop')
	gap = currentOrDeprecated(gap, gap === 'default' ? gap : undefined, true)
	const componentClassName = useClassNameFactory('stack')
	const style: CSSProperties = useMemo(() => ({
		...{ flexBasis: basis },
		...(typeof grow !== 'boolean' ? { flexGrow: grow } : {}),
		...(typeof shrink !== 'boolean' ? { flexShrink: shrink } : {}),
		...styleProp,
	}), [basis, grow, shrink, styleProp])

	return <>
		{children && (
			<div
				{...rest}
				className={componentClassName(null, [
					toViewClass(`${direction}`, true),
					toStateClass('evenly-distributed', evenly),
					toEnumClass('gap-', gap),
					align && toEnumViewClass(`align-${align}`),
					grow === true && toEnumViewClass('grow'),
					justify && toEnumViewClass(`justify-${justify}`),
					shrink === true && toEnumViewClass('shrink'),
					wrap && toEnumViewClass(wrap === true ? 'wrap' : `wrap-${wrap}`),
					className,
				])}
				style={style}
				ref={ref}
			>
				{children}
			</div>
		)}
	</>
}))
Stack.displayName = 'Stack'
