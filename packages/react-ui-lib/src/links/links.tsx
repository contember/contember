import { Component, Link, type LinkProps } from '@contember/interface'
import { AnchorButton, Button } from '../ui/button'
import type { ComponentProps } from 'react'

type LinkAnchorButtonProps = Omit<LinkProps, 'children'> & ComponentProps<typeof AnchorButton>

export const LinkAnchorButton = Component<LinkAnchorButtonProps>(({ to, parameters, ...anchorButtonProps }) => (
	<Link to={to} parameters={parameters}>
		<AnchorButton {...anchorButtonProps} />
	</Link>
))

type LinkButtonProps = Omit<LinkProps, 'children'> & ComponentProps<typeof Button>

export const LinkButton = Component<LinkButtonProps>(({ to, parameters, ...buttonProps }) => (
	<Link to={to} parameters={parameters}>
		<Button {...buttonProps} />
	</Link>
))

type LinkAnchorProps = Omit<LinkProps, 'children'> & Omit<React.ComponentPropsWithoutRef<'a'>, 'href'>

export const LinkAnchor = Component<LinkAnchorProps>(({ to, parameters, ...anchorProps }) => (
	<Link to={to} parameters={parameters}>
		<AnchorButton variant="link" {...anchorProps} />
	</Link>
))
