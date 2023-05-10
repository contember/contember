import classnames from 'classnames'
import { CSSProperties, forwardRef, memo, ReactNode, useMemo } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import type { Size } from '../../types'
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
	style?: JSX.IntrinsicElements['div']['style'],
	wrap?: boolean | 'reverse',
}

export interface StackProps extends StackOwnProps, Omit<JSX.IntrinsicElements['div'], 'children'> { }

export const Stack = memo(
	forwardRef<HTMLDivElement, StackProps>(
		({
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
			const prefix = useClassNamePrefix()

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
						className={classnames(
							`${prefix}stack`,
							toViewClass(`${direction}`, true),
							toStateClass('evenly-distributed', evenly),
							toEnumClass('gap-', gap),
							align && toEnumViewClass(`align-${align}`),
							grow === true && toEnumViewClass('grow'),
							justify && toEnumViewClass(`justify-${justify}`),
							shrink === true && toEnumViewClass('shrink'),
							wrap && toEnumViewClass(wrap === true ? `wrap` : `wrap-${wrap}`),
							className,
						)}
						style={style}
						ref={ref}
					>
						{children}
					</div>
				)}
			</>
		},
	),
)
Stack.displayName = 'Stack'
