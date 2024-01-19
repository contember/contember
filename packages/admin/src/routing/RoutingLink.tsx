import { AnchorHTMLAttributes, ComponentType, FunctionComponent, memo, MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import { RoutingLink as RoutingLinkBase, RoutingLinkProps as RoutingLinkPropsBase } from '@contember/react-routing'

export type { RoutingLinkPropsBase }
export { RoutingLinkBase }

/**
 * Low level link. Usually, you should use {@link Link}
 *
 * @group Routing
 */
export const RoutingLink = memo<RoutingLinkProps & PublicAnchorProps>(({ onClick, to, parametersResolver, parameters, Component, componentProps, target, ...props }) => {
	const InnerComponent = Component ?? 'a'
	return (
		<RoutingLinkBase parameters={parameters} parametersResolver={parametersResolver} to={to}>
			<InnerComponent target={target} {...componentProps} {...props} />
		</RoutingLinkBase>
	)
})
RoutingLink.displayName = 'RoutingLink'

export type PublicAnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>


export interface InnerRoutingLinkProps extends Omit<PublicAnchorProps, 'onClick'> {
	href?: string
	onClick?: (e?: ReactMouseEvent<HTMLAnchorElement>) => void
}


export type RoutingLinkProps<T = {}> =
	& Omit<RoutingLinkPropsBase, 'children'>
	& {
		children?: ReactNode
		Component?: ComponentType<InnerRoutingLinkProps & T>
		componentProps?: T
	}
