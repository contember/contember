import { useClassNameFactory } from '@contember/react-utils'
import { ComponentClassNameProps, dataAttribute } from '@contember/utilities'
import { CSSProperties, ReactNode, forwardRef, memo, useMemo } from 'react'
import type { HTMLDivElementProps } from '../../types'

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

export type StackProps = Omit<HTMLDivElementProps, keyof StackOwnProps> & StackOwnProps

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
				data-direction={dataAttribute(horizontal ? 'horizontal' : 'vertical')}
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
