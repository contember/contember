import { AnchorButton, AnchorButtonProps } from '@contember/ui'
import { memo } from 'react'
import { PageLink } from './index'
import type { PageLinkProps } from './PageLink'

export type PageLinkButtonProps = PageLinkProps & AnchorButtonProps

// TODO forward ref
export const PageLinkButton = memo<PageLinkButtonProps>(({ to, ...buttonProps }) => {
	return (
		<PageLink
			{...buttonProps}
			to={to}
			Component={AnchorButton}
		/>
	)
})
PageLinkButton.displayName = 'PageLinkButton'
