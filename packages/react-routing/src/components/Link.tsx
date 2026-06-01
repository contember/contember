import { Component, useEnvironment } from '@contember/react-binding'
import { useMemo } from 'react'
import { RoutingLink, RoutingLinkProps } from './RoutingLink.js'
import { useBindingLinkParametersResolver } from '../internal/hooks/useBindingLinkParametersResolver.js'
import { parseLinkTarget } from '../internal/utils/parseLinkTarget.js'
import { RoutingLinkFields } from './RoutingLinkFields.js'

export type LinkProps = Omit<RoutingLinkProps, 'parametersResolver'>

/**
 * @group Routing
 */
export const Link = Component(({ to, ...props }: LinkProps) => {
	const parametersResolver = useBindingLinkParametersResolver()
	const env = useEnvironment()
	const desugaredTo = useMemo(() => {
		return parseLinkTarget(to, env)
	}, [to, env])

	return <RoutingLink parametersResolver={parametersResolver} to={desugaredTo} {...props} />
}, props => {
	return (
		<>
			<RoutingLinkFields to={props.to} />
			{props.children}
		</>
	)
})
Link.displayName = 'Link'
