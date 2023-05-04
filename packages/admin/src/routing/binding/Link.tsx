import { Component, Field, useEnvironment } from '@contember/binding'
import { AnchorHTMLAttributes, useMemo } from 'react'
import { RoutingLink, RoutingLinkProps } from '../RoutingLink'
import { RoutingParameter } from '../RoutingParameter'
import { DynamicRequestParameters } from '../types'
import { targetToRequest } from '../useRoutingLink'
import { LinkTarget, parseLinkTarget } from './LinkLanguage'
import { ROUTING_BINDING_PARAMETER_PREFIX, useBindingLinkParametersResolver } from './useBindingLinkParametersResolver'

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>, Omit<RoutingLinkProps, 'parametersResolver'> {
}

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
}, (props, env) => {
	const to = parseLinkTarget(props.to, env)

	return <>
		{createFieldsFromTarget(to).map((it, index) => <Field key={`${index}-${it}`} field={it} />)}
		{props.children}
	</>
})
Link.displayName = 'Link'

/** @deprecated use Link */
export const PageLink = Link


const createFieldsFromTarget = (to: LinkTarget) => {
	const dummyRequest = {
		dimensions: {},
		pageName: '',
		parameters: {},
	}
	const request = targetToRequest(to, dummyRequest)

	return collectDynamicParameters(request?.parameters ?? {})
		.filter(it => it.startsWith(ROUTING_BINDING_PARAMETER_PREFIX))
		.map(it => it.slice(ROUTING_BINDING_PARAMETER_PREFIX.length))
}

const collectDynamicParameters = (parameters: DynamicRequestParameters): string[] => {
	return Object.values(parameters)
		.flatMap(it => {
			if (it instanceof RoutingParameter) {
				return it.name
			}
			if (typeof it === 'object' && it !== null) {
				return collectDynamicParameters(it)
			}
			return null
		})
		.filter((it): it is string => it !== null)
}
