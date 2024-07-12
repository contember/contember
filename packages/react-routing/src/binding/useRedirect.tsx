import { useCallback } from 'react'
import { RequestParameters, RoutingLinkTarget } from '../types'
import { useLinkFactory } from './useLinkFactory'

export const useRedirect = () => {
	const linkFactory = useLinkFactory()
	return useCallback(
		(target: RoutingLinkTarget, parameters?: RequestParameters) => {
			linkFactory(target, parameters).navigate()
		},
		[linkFactory],
	)
}
