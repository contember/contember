import { Slots } from '@contember/layout'
import { useClassName } from '@contember/react-utils'
import { forwardRef } from 'react'

export const AppHeaderTitle = forwardRef<HTMLHeadingElement, Slots.OwnTargetContainerProps>((props, forwardRef) => (
	<h1 ref={forwardRef} {...props} className={useClassName('app-header-title', props.className)} />
))
AppHeaderTitle.displayName = 'TitleWithFallback'
