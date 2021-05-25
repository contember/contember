import cn from 'classnames'
import { memo, ReactNode } from 'react'
import { useComponentClassName } from '../../auxiliary'
import type { ButtonListFlow } from '../../types'
import { toEnumViewClass } from '../../utils'

export interface ButtonListProps {
	children?: ReactNode
	flow?: ButtonListFlow
}

export const ButtonList = memo(({ children, flow }: ButtonListProps) => (
	<div className={cn(useComponentClassName('button-list'), toEnumViewClass(flow, 'inline'))} role="group">
		{children}
	</div>
))
ButtonList.displayName = 'ButtonList'
