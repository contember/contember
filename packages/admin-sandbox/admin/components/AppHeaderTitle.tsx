import { Slots } from '@contember/layout'
import { useClassName } from '@contember/react-utils'
import { forwardRef, memo } from 'react'
import ContentLoader from 'react-content-loader'

const Fallback = memo(() => (
	<ContentLoader
		speed={2}
		backgroundColor="transparent"
		foregroundColor="currentColor"
		foregroundOpacity={0.1}
		height="1em"
		width="100%"
	>
		<rect x="0" y="0" rx="0.25em" ry="0.25em" width="100%" height="1em" />
	</ContentLoader>
))
Fallback.displayName = 'AppHeaderTitle.Fallback'

const Root = memo(forwardRef<HTMLHeadingElement, Slots.OwnTargetContainerProps>((props, forwardRef) => (
	<h1 ref={forwardRef} {...props} className={useClassName('app-header-title', props.className)} />
)))
Root.displayName = 'AppHeaderTitle'

export const AppHeaderTitle = Object.assign(Root, { Fallback })
