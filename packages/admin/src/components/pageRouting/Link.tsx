import { AnchorHTMLAttributes, useMemo } from 'react'
import {
	DynamicRequestParameters,
	RoutingLink,
	RoutingLinkProps,
	RoutingLinkTarget,
	RoutingParameter,
	targetToRequest,
} from '../../routing'
import { ROUTING_BINDING_PARAMETER_PREFIX, useBindingLinkParametersResolver } from './useBindingLinkParametersResolver'
import { Component, Environment, Field, QueryLanguage, useEnvironment } from '@contember/binding'

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>, Omit<RoutingLinkProps, 'parametersResolver'> {
}

export const Link = Component(({ to, ...props }: LinkProps) => {
	const parametersResolver = useBindingLinkParametersResolver()
	const env = useEnvironment()
	const desugaredTo = useMemo(() => {
		return desugarTarget(to, env)
	}, [to, env])

	return <RoutingLink parametersResolver={parametersResolver} to={desugaredTo} {...props} />
}, (props, env) => {
	const to = desugarTarget(props.to, env)

	return <>
		{fieldsFromTarget(to).map(it => <Field field={it} />)}
	</>
})
Link.displayName = 'Link'

/** @deprecated use Link */
export const PageLink = Link

const desugarTarget = (to: RoutingLinkTarget, env: Environment): Exclude<RoutingLinkTarget, string> => {
	if (typeof to !== 'string') {
		return to
	}
	const parsedTarget = QueryLanguage.desugarTaggedMap(to, env)
	return {
		pageName: parsedTarget.name,
		parameters: Object.fromEntries(parsedTarget.entries.map(it => {
			switch (it.value.type) {
				case 'literal':
					return [it.key, typeof it.value.value === 'number' ? String(it.value.value) : it.value.value ?? undefined]
				case 'variable':
					return [it.key, new RoutingParameter(it.value.value)]
			}
		})),
	}
}

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
