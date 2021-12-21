import { useCallback } from 'react'
import { useBindingLinkParametersResolver } from './useBindingLinkParametersResolver'
import { useRoutingLinkFactory } from '../useRoutingLink'
import { RequestParameters, RoutingLinkTarget } from '../types'
import { parseLinkTarget } from './LinkLanguage'
import { useEnvironment } from '@contember/binding'

export const useRedirect = () => {
	const parametersResolver = useBindingLinkParametersResolver()
	const linkFactory = useRoutingLinkFactory(parametersResolver)
	const env = useEnvironment()
	return useCallback(
		(target: RoutingLinkTarget, parameters?: RequestParameters) => {
			const parsedTarget = parseLinkTarget(target, env)
			linkFactory(parsedTarget, parameters).navigate()
		},
		[env, linkFactory],
	)
}
