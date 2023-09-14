import { useCallback } from 'react'
import { useBindingLinkParametersResolver } from './useBindingLinkParametersResolver'
import { useRoutingLinkFactory } from '../useRoutingLink'
import { RequestParameters, RoutingLinkTarget } from '../types'
import { parseLinkTarget } from './LinkLanguage'
import { useEnvironment } from '@contember/react-binding'

export const useRedirect = () => {
	const parametersResolver = useBindingLinkParametersResolver()
	const linkFactory = useRoutingLinkFactory()
	const env = useEnvironment()
	return useCallback(
		(target: RoutingLinkTarget, parameters?: RequestParameters) => {
			const parsedTarget = parseLinkTarget(target, env)
			linkFactory(parsedTarget, parameters, parametersResolver).navigate()
		},
		[env, linkFactory, parametersResolver],
	)
}
