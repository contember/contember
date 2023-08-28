import { useClassName } from '@contember/react-utils'
import { forwardRef, memo } from 'react'
import type { HTMLHeadingElementProps, HeadingDepth, HeadingDistinction, Size } from '../../types'
import { toEnumViewClass } from '../../utils'
import { Text, TextProps } from './Text'

export type HeadingOwnProps = {
	distinction?: HeadingDistinction
	depth?: HeadingDepth
	size?: { [S in Size]: S }['small' | 'default'] // This silly-ish type disallows typos on our part & improves user intellisense
}

export type HeadingProps =
	& Omit<TextProps, keyof HeadingOwnProps>
	& Omit<HTMLHeadingElementProps, 'ref' | keyof HeadingOwnProps | keyof TextProps>
	& HeadingOwnProps

/**
 * @group UI
 */
export const Heading = memo(forwardRef<HTMLHeadingElement, HeadingProps>(({
	className,
	distinction,
	depth,
	size,
	...headingProps
}, ref) => {
	const normalizedDepth = depth ?? 6
	const headingElement = `h${normalizedDepth}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

	return (
		<Text
			as={headingElement}
			ref={ref}
			className={useClassName('heading', [className, toEnumViewClass(size), toEnumViewClass(distinction)])}
			{...headingProps}
		/>
	)
}))
Heading.displayName = 'Heading'
