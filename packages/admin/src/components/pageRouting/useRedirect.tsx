import { useCallback } from 'react'
import { RequestParameters, RoutingLinkTarget, useRoutingLinkFactory } from '../../routing'
import { useBindingLinkParametersResolver } from './useBindingLinkParametersResolver'

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
