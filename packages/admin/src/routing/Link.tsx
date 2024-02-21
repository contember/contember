import { Component } from '@contember/react-binding'
import { AnchorHTMLAttributes } from 'react'
import { Link as LinkBase } from '@contember/react-routing'
import { RoutingLinkProps } from './RoutingLink'

export type LinkProps =
	& Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>
	& Omit<RoutingLinkProps, 'parametersResolver'>

/**
 * @group Routing
 */
export const Link = Component(({ onClick, to, parameters, Component, componentProps, target, ...props }: LinkProps) => {
	const InnerComponent = Component ?? 'a'
	return (
		<LinkBase parameters={parameters} to={to}>
			<InnerComponent target={target} {...componentProps} {...props} />
		</LinkBase>
	)
})
Link.displayName = 'Link'
