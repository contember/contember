import { AnchorHTMLAttributes } from 'react'
import {
	DynamicRequestParameters,
	RoutingLink,
	RoutingLinkProps,
	RoutingLinkTarget,
	RoutingParameter,
	targetToRequest,
} from '../../routing'
import { ROUTING_BINDING_PARAMETER_PREFIX, useBindingLinkParametersResolver } from './useBindingLinkParametersResolver'
import { Component, Field } from '@contember/binding'

export interface PageLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>, Omit<RoutingLinkProps, 'parametersResolver'> {
}

export const PageLink = Component((props: PageLinkProps) => {
	const parametersResolver = useBindingLinkParametersResolver()

	return <RoutingLink parametersResolver={parametersResolver} {...props} />
}, props =>
	<>
		{fieldsFromTarget(props.to).map(it => <Field field={it} />)}
	</>)
PageLink.displayName = 'PageLink'

const fieldsFromTarget = (to: RoutingLinkTarget) => {
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
