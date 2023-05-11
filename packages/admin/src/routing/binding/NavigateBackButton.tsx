import { Icon } from '@contember/ui'
import { memo } from 'react'
import { LinkButton, LinkButtonProps } from './LinkButton'

/**
 * @group Routing
 */
export const NavigateBackButton = memo<LinkButtonProps>(props => (
	<LinkButton distinction="seamless" size="small" style={{ marginLeft: '-.38em' }} {...props}>
		<Icon blueprintIcon="chevron-left" />
		{props.children}
	</LinkButton>
))
