import { useMemo } from 'react'
import { RequestParameters, RoutingLinkTarget, RoutingParameterResolver } from '../types'
import { useRoutingLinkFactory } from './useRoutingLinkFactory'


export const useRoutingLink = (target: RoutingLinkTarget, parametersResolver?: RoutingParameterResolver, parameters?: RequestParameters) => {
	const linkFactory = useRoutingLinkFactory()
	return useMemo(() => {
		return linkFactory(target, parameters, parametersResolver)
	}, [linkFactory, parameters, parametersResolver, target])
}
