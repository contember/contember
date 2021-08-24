import { useCallback, useMemo } from 'react'
import { RequestState, RequestChange, pageRequest } from '../../state/request'
import { useDispatch, useSelector } from 'react-redux'
import State from '../../state'
import { requestStateToPath, useRouting } from '../../routing'
import { createAction } from 'redux-actions'
import { REQUEST_REPLACE } from '../../reducer/request'

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
	const currentRequest = useSelector<State, State['request']>(({ request }) => request)
	const routing = useRouting()
	const dispatch = useDispatch()

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
				dispatch(createAction(REQUEST_REPLACE, () => request ? { ...request } : null)())
			},
		}
	}, [currentRequest, dispatch, routing])
}

export const useLink = (target: LinkTarget) => {
	const linkFactory = useLinkFactory()
	return useMemo(() => {
		return linkFactory(target)
	}, [target, linkFactory])
}
