import { Button, ButtonProps } from '@contember/ui'
import { memo } from 'react'
import { PageLink } from './index'
import type { PageLinkProps } from './PageLink'

export type PageLinkButtonProps = PageLinkProps & ButtonProps

// TODO forward ref
export const PageLinkButton = memo<PageLinkButtonProps>(({ to, children, ...buttonProps }) => {
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
