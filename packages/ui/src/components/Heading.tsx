import * as React from 'react'
import { HeadingDepthContext } from '../contexts'
import { HeadingDepth } from '../types'
import cn from 'classnames'

export interface HeadingProps
	extends Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>, 'ref'> {
	depth?: HeadingDepth
}

export const Heading = React.memo(
	React.forwardRef<HTMLHeadingElement, HeadingProps>(({ depth, className, children, ...headingProps }, ref) => {
		const levelContext = React.useContext(HeadingDepthContext)
		const normalizedDepth = depth || levelContext
		const headingElement = `h${normalizedDepth}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

		return React.createElement(headingElement, { ref, className: cn('heading', className), ...headingProps }, children)
	}),
)
