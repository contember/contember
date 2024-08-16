import { dataAttribute, isSpecialLinkClick } from '@contember/utilities'
import { memo, MouseEvent as ReactMouseEvent, ReactElement, useCallback } from 'react'
import { RequestParameters, RoutingLinkTarget, RoutingParameterResolver } from '../types'
import { useRoutingLink } from '../hooks'
import { Slot } from '@radix-ui/react-slot'

export interface RoutingLinkProps {
	children?: ReactElement
	to: RoutingLinkTarget
	parametersResolver?: RoutingParameterResolver
	parameters?: RequestParameters
}
/**
 * Low level link. Usually, you should use {@link Link}
 *
 * @group Routing
 */
export const RoutingLink = memo<RoutingLinkProps>(({ to, parametersResolver, parameters, ...props }) => {
	const { navigate, isActive: active, href } = useRoutingLink(to, parametersResolver, parameters)

	const innerOnClick = useCallback((e?: ReactMouseEvent<HTMLElement, MouseEvent>) => {
		if (e) {
			if (e.isDefaultPrevented() || isSpecialLinkClick(e.nativeEvent)) {
				return
			}
		}
		navigate(e)
	}, [navigate])

	return (
		<Slot
			onClick={innerOnClick}
			data-active={dataAttribute(active)}
			{...{ href }}
			{...props}
		/>
	)
})



RoutingLink.displayName = 'RoutingLink'
