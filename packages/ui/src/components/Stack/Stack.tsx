import { useClassNameFactory } from '@contember/react-utils'
import { ComponentClassNameProps, dataAttribute, deprecate, fallback, isDefined } from '@contember/utilities'
import { CSSProperties, ReactNode, forwardRef, memo, useMemo } from 'react'
import type { HTMLDivElementProps, Size } from '../../types'

export interface StackOwnProps extends ComponentClassNameProps {
	align?: 'center' | 'stretch' | 'start' | 'end',
	basis?: CSSProperties['flexBasis'],
	children?: ReactNode,
	evenly?: boolean,
	gap?: boolean | 'gap' | 'double' | 'gutter' | 'padding' | 'large' | 'larger'
	grow?: boolean | CSSProperties['flexGrow']
	horizontal?: boolean
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
	reverse?: boolean
	shrink?: boolean | CSSProperties['flexShrink']
	style?: CSSProperties,
	wrap?: boolean | 'reverse'
}

/** @deprecated Use other prop values */
export type DeprecatedStackSize = Size | 'xlarge' | 'none'

/** @deprecated Use `StackOwnProps` instead */
export type DeprecatedStackProps = {
	/** @deprecated Use combination of `horizontal` and `reverse` props instead */
	direction?: 'vertical' | 'horizontal' | 'vertical-reverse' | 'horizontal-reverse'
	gap?: StackOwnProps['gap'] | DeprecatedStackSize
}

export type StackProps =
	& Omit<HTMLDivElementProps, keyof StackOwnProps | keyof DeprecatedStackProps>
	& Omit<StackOwnProps, keyof DeprecatedStackProps>
	& DeprecatedStackProps

/**
 * The `Stack` components allows you to stack any content vertically or horizontally.
 *
 * @example
 * ```
 * <Stack  horizontal />
 * ```
 *
 * @group UI
 */
export const Stack = memo(forwardRef<HTMLDivElement, StackProps>(({
	align,
	basis,
	evenly,
	children,
	className: classNameProp,
	componentClassName = 'stack',
	direction,
	gap = 'gutter',
	grow,
	horizontal,
	justify,
	reverse,
	shrink,
	style: styleProp,
	wrap,
	...rest
}: StackProps, ref) => {
	deprecate('1.3.0', gap === 'none', '`gap="none"`', '`gap={false}`')
	gap = fallback(gap, gap === 'none', false)

	deprecate('1.3.0', gap === 'small', '`gap="small"`', '`gap="gap"`')
	gap = fallback(gap, gap === 'small', 'gap')

	deprecate('1.3.0', gap === 'xlarge', '`gap="xlarge"`', '`gap="larger"`')
	gap = fallback(gap, gap === 'xlarge', 'larger')

	deprecate('1.3.0', gap === 'default', '`gap="default"`', 'omit the `gap` prop')
	gap = fallback(gap, gap === 'default', true)

	deprecate('1.3.0', direction === 'horizontal-reverse', '`direction="horizontal-reverse"`', '`horizontal` and `reverse` props')
	deprecate('1.3.0', direction === 'vertical-reverse', '`direction="vertical-reverse"`', 'reverse` prop')
	reverse = fallback(reverse, direction === 'horizontal-reverse' || direction === 'vertical-reverse', true)

	// NOTE: When finally removing the direction prop, keep local variable `direction` for `data-direction` attribute
	direction = fallback(direction ?? 'vertical', isDefined(horizontal), horizontal ? 'horizontal' : 'vertical')
	direction = fallback(direction, direction === 'horizontal-reverse', 'horizontal')
	direction = fallback(direction, direction === 'vertical-reverse', 'vertical')

	const className = useClassNameFactory(componentClassName)
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
				data-align={dataAttribute(align)}
				data-evenly={dataAttribute(evenly)}
				data-gap={dataAttribute(gap)}
				data-grow={dataAttribute(grow)}
				data-direction={dataAttribute(direction)}
				data-justify={dataAttribute(justify)}
				data-reverse={dataAttribute(reverse)}
				data-shrink={dataAttribute(shrink)}
				data-wrap={dataAttribute(wrap)}
				className={className(null, classNameProp)}
				style={style}
				ref={ref}
			>
				{children}
			</div>
		)}
	</>
}))
Stack.displayName = 'Stack'
