import { AnchorButton, AnchorButtonProps } from '@contember/ui'
import type { LinkProps } from './Link'
import { Link } from './Link'
import { Component } from '@contember/binding'

export type LinkButtonProps = LinkProps & AnchorButtonProps

// TODO forward ref
/**
 * Link rendered as a button.
 *
 * @group Routing
 */
export const LinkButton = Component<LinkButtonProps>(({ to, ...buttonProps }) => {
	return (
		<Link
			{...buttonProps}
			to={to}
			Component={AnchorButton}
		/>
	)
})
LinkButton.displayName = 'LinkButton'

/** @deprecated use LinkButton */
export const PageLinkButton = LinkButton
