import { createBindingLinkParametersResolver, useBindingLinkParametersResolver } from './useBindingLinkParametersResolver'
import { useRoutingLinkFactory } from '../useRoutingLink'
import { useCallback } from 'react'
import { parseLinkTarget } from './LinkLanguage'
import { EntityAccessor, useEnvironment } from '@contember/react-binding'
import { RequestParameters, RoutingLinkTarget } from '../types'

export const useLinkFactory = () => {
	const parametersResolver = useBindingLinkParametersResolver()
	const linkFactory = useRoutingLinkFactory()
	const env = useEnvironment()
	return useCallback((target: RoutingLinkTarget, parameters?: RequestParameters, entity?: EntityAccessor) => {
		const parsedTarget = parseLinkTarget(target, env)
		const resolver = entity ? createBindingLinkParametersResolver(entity) : parametersResolver
		return linkFactory(parsedTarget, parameters, resolver)
	}, [env, linkFactory, parametersResolver])
}
