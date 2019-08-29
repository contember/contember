import { Button, ButtonProps } from '@contember/ui'
import * as React from 'react'
import { PageLink } from './index'
import { PageLinkProps } from './PageLink'

export type PageLinkButtonProps = PageLinkProps & ButtonProps

// TODO forward ref
export const PageLinkButton = React.memo<PageLinkButtonProps>(({ to, children, ...buttonProps }) => {
	return (
		<PageLink
			{...buttonProps}
			to={to}
			Component={({ isActive, ...buttonProps }) => (
				<Button {...buttonProps} Component="a">
					{children}
				</Button>
			)}
		/>
	)
})
PageLinkButton.displayName = 'PageLinkButton'
