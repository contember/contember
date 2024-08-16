import { BaseSyntheticEvent, useCallback } from 'react'
import { useCurrentRequest, usePushRequest, useRouting } from '../contexts'
import { RequestParameters, RoutingLinkTarget, RoutingParameterResolver } from '../types'
import { targetToRequest } from '../internal/utils/targetToRequest'
import { resolveParameters } from '../internal/utils/resolveParameters'
import { requestStateToPath } from '../internal/utils/urlMapper'
import { PageNotFound } from '../PageNotFound'


export interface RoutingLinkParams {
	href: string
	navigate: (e?: BaseSyntheticEvent) => void
	isActive: boolean
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
