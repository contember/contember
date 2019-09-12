import * as React from 'react'
import { PageLinkButton, PageLinkButtonProps } from './PageLinkButton'

export const NavigateBackButton = React.memo<PageLinkButtonProps>(props => (
	<PageLinkButton distinction="seamless" size="small" style={{ marginLeft: '-.3em' }} {...props}>
		<span
			style={{ fontSize: '.7em', display: 'inline-block', top: '-.09em', position: 'relative', marginRight: '.25em' }}
		>
			❰
		</span>
		{props.children}
	</PageLinkButton>
))
