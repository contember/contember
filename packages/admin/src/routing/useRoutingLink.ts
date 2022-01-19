import { BaseSyntheticEvent, useCallback, useMemo } from 'react'
import {
	DynamicRequestParameters,
	IncompleteRequestState,
	RequestParameters,
	RoutingParameterResolver,
	RequestChange,
	RequestState, RoutingLinkTarget,
} from './types'
import { requestChangeFactory, useCurrentRequest, usePushRequest } from './RequestContext'
import { useRouting } from './RoutingContext'
import { PageNotFound, requestStateToPath } from './urlMapper'
import { RoutingParameter } from './RoutingParameter'

export interface RoutingLinkParams {
	href: string
	navigate: (e?: BaseSyntheticEvent) => void
	isActive: boolean
}


export const isRoutingLinkTarget = (value: unknown): value is RoutingLinkTarget => {
	return typeof value === 'string'
		|| typeof value === 'function'
		|| (typeof value === 'object' && value !== null && 'pageName' in value)
}

export const targetToRequest = (target: RoutingLinkTarget, currentRequest: RequestState): IncompleteRequestState | null => {
	if (typeof target === 'string') {
		return requestChangeFactory(target, {})(currentRequest)
	}
	if (typeof target === 'function') {
		return target(currentRequest)
	}
	if (target === null) {
		return null
	}
	return target
}

const resolveParameters = (parameters: DynamicRequestParameters, resolveParameter: RoutingParameterResolver): RequestParameters => {
	return Object.fromEntries(Object.entries(parameters).map(([name, value]) => {
		if (value instanceof RoutingParameter) {
			return [name, resolveParameter(value.name)]
		}
		return [name, value]
	}))
}

export const useRoutingLinkFactory = (parametersResolver?: RoutingParameterResolver) => {
	const currentRequest = useCurrentRequest()
	const routing = useRouting()
	const pushRequest = usePushRequest()

	return useCallback((target: RoutingLinkTarget, parameters?: RequestParameters, innerParametersResolver?: RoutingParameterResolver): RoutingLinkParams => {
		const tmpRequest = targetToRequest(target, currentRequest)
		const request = tmpRequest === null ? null : {
			pageName: tmpRequest.pageName,
			dimensions: tmpRequest.dimensions ?? currentRequest?.dimensions ?? {},
			parameters: resolveParameters(tmpRequest.parameters ?? {}, param => {
				if (param.startsWith('request.')) {
					return currentRequest?.parameters[param.slice('request.'.length)]
				}
				if (parameters && (param in parameters)) {
					return parameters[param]
				}

				if (!parametersResolver && !innerParametersResolver) {
					throw new PageNotFound(`Routing parameter ${param} not found`)
				}

				return (innerParametersResolver ?? parametersResolver)?.(param)
			}),
		}
		let href: string
		try {
			href = requestStateToPath(routing, request)
		} catch (e) {
			if (import.meta.env.DEV) {
				throw e
			}
			href = '#'
		}
		return {
			href: href,
			isActive: window.location.pathname === href, // todo better active detection
			navigate: e => {
				e?.preventDefault()
				pushRequest(request)
			},
		}
	}, [currentRequest, parametersResolver, pushRequest, routing])
}

export const useRoutingLink = (target: RoutingLinkTarget, parametersResolver?: RoutingParameterResolver, parameters?: RequestParameters) => {
	const linkFactory = useRoutingLinkFactory(parametersResolver)
	return useMemo(() => {
		return linkFactory(target, parameters)
	}, [linkFactory, parameters, target])
}
