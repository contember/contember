import { BaseSyntheticEvent, useCallback, useMemo } from 'react'
import { requestChangeFactory, useCurrentRequest, usePushRequest } from './RequestContext'
import { useRouting } from './RoutingContext'
import { RoutingParameter } from './RoutingParameter'
import { DynamicRequestParameters, IncompleteRequestState, RequestParameters, RequestState, RoutingLinkTarget, RoutingParameterResolver } from './types'
import { PageNotFound, requestStateToPath } from './urlMapper'

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

export const useRoutingLinkFactory = () => {
	const currentRequest = useCurrentRequest()
	const routing = useRouting()
	const pushRequest = usePushRequest()

	return useCallback((target: RoutingLinkTarget, parameters?: RequestParameters, parametersResolver?: RoutingParameterResolver): RoutingLinkParams => {
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

				if (!parametersResolver) {
					throw new PageNotFound(`Routing parameter ${param} not found`)
				}

				return (parametersResolver)?.(param)
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
	}, [currentRequest, pushRequest, routing])
}

export const useRoutingLink = (target: RoutingLinkTarget, parametersResolver?: RoutingParameterResolver, parameters?: RequestParameters) => {
	const linkFactory = useRoutingLinkFactory()
	return useMemo(() => {
		return linkFactory(target, parameters, parametersResolver)
	}, [linkFactory, parameters, parametersResolver, target])
}
