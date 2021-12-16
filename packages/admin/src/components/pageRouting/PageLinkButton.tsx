import { AnchorButton, AnchorButtonProps } from '@contember/ui'
import { PageLink } from './index'
import type { PageLinkProps } from './PageLink'
import { Component } from '@contember/binding'

export type PageLinkButtonProps = PageLinkProps & AnchorButtonProps

// TODO forward ref
export const PageLinkButton = Component<PageLinkButtonProps>(({ to, ...buttonProps }) => {
	return (
		<PageLink
			{...buttonProps}
			to={to}
			Component={AnchorButton}
		/>
	)
})
PageLinkButton.displayName = 'PageLinkButton'
