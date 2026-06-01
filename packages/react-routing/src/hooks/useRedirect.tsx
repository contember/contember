import { useCallback } from 'react'
import { RequestParameters, RoutingLinkTarget } from '../types/index.js'
import { useLinkFactory } from './useLinkFactory.js'

export const useRedirect = () => {
	const linkFactory = useLinkFactory()
	return useCallback(
		(target: RoutingLinkTarget, parameters?: RequestParameters) => {
			linkFactory(target, parameters).navigate()
		},
		[linkFactory],
	)
}
