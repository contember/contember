import { isSpecialLinkClick } from '@contember/ui'
import {
	AnchorHTMLAttributes,
	ComponentType,
	FunctionComponent,
	memo,
	MouseEvent as ReactMouseEvent,
	ReactNode,
	useCallback,
} from 'react'
import { useRoutingLink } from './useRoutingLink'
import { RequestParameters, RoutingLinkTarget, RoutingParameterResolver } from './types'


const defaultComponent: FunctionComponent<InnerRoutingLinkProps> = ({ isActive, ...props }) => (
	// TODO do something with isActive?
	<a {...props} />
)

export const RoutingLink = memo<RoutingLinkProps & PublicAnchorProps>(({ onClick, to, parametersResolver, parameters, Component, ...props }) => {
	const { navigate, isActive, href } = useRoutingLink(to, parametersResolver, parameters)

	const innerOnClick = useCallback((e?: ReactMouseEvent<HTMLAnchorElement, MouseEvent>) => {
		if (e) {
			if (onClick) {
				onClick(e)
			}
			if (e.isDefaultPrevented() || isSpecialLinkClick(e.nativeEvent)) {
				return
			}
		}
		navigate(e)
	}, [navigate, onClick])

	const InnerComponent = Component ?? defaultComponent
	return <InnerComponent isActive={isActive} href={href} {...props} onClick={innerOnClick} />
})
RoutingLink.displayName = 'RoutingLink'

export type PublicAnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>


export interface InnerRoutingLinkProps extends Omit<PublicAnchorProps, 'onClick'> {
	href: string
	isActive: boolean
	onClick: (e?: ReactMouseEvent<HTMLAnchorElement>) => void
}


export interface RoutingLinkProps {
	Component?: ComponentType<InnerRoutingLinkProps>
	children?: ReactNode
	to: RoutingLinkTarget
	parametersResolver?: RoutingParameterResolver
	parameters?: RequestParameters
}
