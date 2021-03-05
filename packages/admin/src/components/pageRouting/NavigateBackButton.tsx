import { Icon } from '@contember/ui'
import { memo } from 'react'
import { PageLinkButton, PageLinkButtonProps } from './PageLinkButton'

export const NavigateBackButton = memo<PageLinkButtonProps>(props => (
	<PageLinkButton distinction="seamless" size="small" style={{ marginLeft: '-.38em' }} {...props}>
		<Icon blueprintIcon="chevron-left" />
		{props.children}
	</PageLinkButton>
))
