import { useCallback } from 'react'
import { useBindingLinkParametersResolver } from './useBindingLinkParametersResolver'
import { useRoutingLinkFactory } from '../useRoutingLink'
import { RequestParameters, RoutingLinkTarget } from '../types'

export const useRedirect = () => {
	const parametersResolver = useBindingLinkParametersResolver()
	const linkFactory = useRoutingLinkFactory(parametersResolver)
	return useCallback(
		(target: RoutingLinkTarget, parameters?: RequestParameters) => {
			linkFactory(target, parameters).navigate()
		},
		[linkFactory],
	)
}
