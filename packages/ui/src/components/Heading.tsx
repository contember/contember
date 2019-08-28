import * as React from 'react'
import { HeadingLevelContext } from '../contexts'
import { HeadingLevel } from '../types'
import cn from 'classnames'

export interface HeadingProps
	extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement> {
	level?: HeadingLevel
}

export const Heading = React.memo(
	React.forwardRef<HTMLHeadingElement, HeadingProps>(({ level, className, children, ...headingProps }, ref) => {
		const levelContext = React.useContext(HeadingLevelContext)
		const normalizedLevel = level || levelContext || 1
		const headingElement = `h${normalizedLevel}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

		return React.createElement(headingElement, { ref, className: cn('heading', className), ...headingProps }, children)
	}),
)
