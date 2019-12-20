import cn from 'classnames'
import * as React from 'react'
import { useComponentClassName } from '../auxiliary'
import { HeadingDepthContext } from '../contexts'
import { HeadingDepth, Size } from '../types'
import { toEnumViewClass } from '../utils'

export interface HeadingProps
	extends Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>, 'ref'> {
	depth?: HeadingDepth
	size?: { [S in Size]: S }['small' | 'default'] // This silly-ish type disallows typos on our part & improves user intellisense
}

export const Heading = React.memo(
	React.forwardRef<HTMLHeadingElement, HeadingProps>(({ children, className, depth, size, ...headingProps }, ref) => {
		const levelContext = React.useContext(HeadingDepthContext)
		const normalizedDepth = depth || levelContext
		const headingElement = `h${normalizedDepth}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

		return React.createElement(
			headingElement,
			{ ref, className: cn(useComponentClassName('heading'), className, toEnumViewClass(size)), ...headingProps },
			children,
		)
	}),
)
Heading.displayName = 'Heading'
