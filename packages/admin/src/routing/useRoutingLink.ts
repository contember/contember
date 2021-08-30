import { BaseSyntheticEvent, useCallback, useMemo } from 'react'
import { RequestChange, RequestState } from './types'
import { requestChangeFactory, useCurrentRequest, usePushRequest } from './RequestContext'
import { useRouting } from './RoutingContext'
import { requestStateToPath } from './urlMapper'

export interface RoutingLinkParams {
	href: string
	navigate: (e?: BaseSyntheticEvent) => void
	isActive: boolean
}

export type RoutingLinkTarget = string | RequestChange | (Partial<RequestState> & { pageName: string })

export const isRoutingLinkTarget = (value: unknown): value is RoutingLinkTarget => {
	return typeof value === 'string'
		|| typeof value === 'function'
		|| (typeof value === 'object' && value !== null && 'pageName' in value)
}

const targetToRequest = (target: RoutingLinkTarget, currentRequest: RequestState): RequestState => {
	if (typeof target === 'string') {
		return requestChangeFactory(target, {})(currentRequest)
	}
	if (typeof target === 'function') {
		return target(currentRequest)
	}
	if (target === null) {
		return null
	}
	return {
		pageName: target.pageName,
		parameters: target.parameters ?? {},
		dimensions: target.dimensions ?? currentRequest?.dimensions ?? {},
	}
}

export const useRoutingLinkFactory = () => {
	const currentRequest = useCurrentRequest()
	const routing = useRouting()
	const pushRequest = usePushRequest()

	return useCallback((target: RoutingLinkTarget): RoutingLinkParams => {
		const request = targetToRequest(target, currentRequest)
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
				if (request !== null) {
					window.history.pushState({}, document.title, href)
					e?.preventDefault()
				}
				pushRequest(request)
			},
		}
	}, [currentRequest, pushRequest, routing])
}

export const useRoutingLink = (target: RoutingLinkTarget) => {
	const linkFactory = useRoutingLinkFactory()
	return useMemo(() => {
		return linkFactory(target)
	}, [target, linkFactory])
}
