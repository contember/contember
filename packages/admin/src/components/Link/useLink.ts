import { useCallback, useMemo } from 'react'
import {
	pageRequest,
	RequestChange,
	RequestState,
	requestStateToPath,
	useCurrentRequest,
	usePushRequest,
	useRouting,
} from '../../routing'

export interface LinkProps
{
	href: string
	navigate: () => void
	isActive: boolean
}

export type LinkTarget = string | RequestChange | (Partial<RequestState> & {pageName: string})

const targetToRequest = (target: LinkTarget, currentRequest: RequestState): RequestState => {
	if (typeof target === 'string') {
		return pageRequest(target, {})(currentRequest)
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

export const useLinkFactory = () => {
	const currentRequest = useCurrentRequest()
	const routing = useRouting()
	const pushRequest = usePushRequest()

	return useCallback((target: LinkTarget): LinkProps => {
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
			navigate: () => {
				if (request !== null) {
					window.history.pushState({}, document.title, href)
				}
				pushRequest(request)
			},
		}
	}, [currentRequest, pushRequest, routing])
}

export const useLink = (target: LinkTarget) => {
	const linkFactory = useLinkFactory()
	return useMemo(() => {
		return linkFactory(target)
	}, [target, linkFactory])
}
