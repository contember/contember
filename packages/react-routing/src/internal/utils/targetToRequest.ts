import { IncompleteRequestState, RequestState, RoutingLinkTarget } from '../../types'

export const targetToRequest = (target: RoutingLinkTarget, currentRequest: RequestState): IncompleteRequestState | null => {
	if (typeof target === 'function') {
		target = target(currentRequest)
	}
	if (typeof target === 'string') {
		return {
			pageName: target,
			parameters: {},
			dimensions: currentRequest?.dimensions || {},
		}
	}
	if (target === null) {
		return null
	}
	return target
}
