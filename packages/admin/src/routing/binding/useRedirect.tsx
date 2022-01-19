import { useCallback } from 'react'
import { useBindingLinkParametersResolver } from './useBindingLinkParametersResolver'
import { useRoutingLinkFactory } from '../useRoutingLink'
import { RequestParameters, RoutingLinkTarget, RoutingParameterResolver } from '../types'
import { parseLinkTarget } from './LinkLanguage'
import { useEnvironment } from '@contember/binding'

export const useRedirect = () => {
	const parametersResolver = useBindingLinkParametersResolver()
	const linkFactory = useRoutingLinkFactory(parametersResolver)
	const env = useEnvironment()
	return useCallback(
		(target: RoutingLinkTarget, parameters?: RequestParameters, parametersResolver?: RoutingParameterResolver) => {
			const parsedTarget = parseLinkTarget(target, env)
			linkFactory(parsedTarget, parameters, parametersResolver).navigate()
		},
		[env, linkFactory],
	)
}
