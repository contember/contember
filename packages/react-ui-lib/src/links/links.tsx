import { Component, Link as LinkPrimitive, type LinkProps as LinkPrimitiveProps } from '@contember/interface'
import type { ComponentProps } from 'react'
import { AnchorButton } from '../ui/button'

type StyledLinkProps = Omit<LinkPrimitiveProps, 'children'> & ComponentProps<typeof AnchorButton>

export const StyledLink = Component<StyledLinkProps>(({ to, parameters, ...anchorButtonProps }) => (
	<LinkPrimitive to={to} parameters={parameters}>
		<AnchorButton variant="link" {...anchorButtonProps} />
	</LinkPrimitive>
))
