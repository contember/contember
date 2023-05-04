import cn from 'classnames'
import { createElement, forwardRef, memo } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import type { HeadingDepth, HeadingDistinction, HTMLHeadingElementProps, Size } from '../../types'
import { toEnumViewClass } from '../../utils'

export type HeadingProps =
	& {
		distinction?: HeadingDistinction
		depth?: HeadingDepth
		size?: { [S in Size]: S }['small' | 'default'] // This silly-ish type disallows typos on our part & improves user intellisense
	}
	& Omit<HTMLHeadingElementProps, 'ref'>

/**
 * @group UI
 */
export const Heading = memo(forwardRef<HTMLHeadingElement, HeadingProps>(({
	children,
	className,
	distinction,
	depth,
	size,
	...headingProps
}, ref) => {
	const prefix = useClassNamePrefix()
	const normalizedDepth = depth ?? 6
	const headingElement = `h${normalizedDepth}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

	return createElement(
		headingElement,
		{
			ref,
			className: cn(`${prefix}heading`, className, toEnumViewClass(size), toEnumViewClass(distinction)),
			...headingProps,
		},
		children,
	)
}))
Heading.displayName = 'Heading'
