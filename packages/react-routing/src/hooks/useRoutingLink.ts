import { useMemo } from 'react'
import { RequestParameters, RoutingLinkTarget, RoutingParameterResolver } from '../types/index.js'
import { useRoutingLinkFactory } from './useRoutingLinkFactory.js'

export const useRoutingLink = (target: RoutingLinkTarget, parametersResolver?: RoutingParameterResolver, parameters?: RequestParameters) => {
	const linkFactory = useRoutingLinkFactory()
	return useMemo(() => {
		return linkFactory(target, parameters, parametersResolver)
	}, [linkFactory, parameters, parametersResolver, target])
}
