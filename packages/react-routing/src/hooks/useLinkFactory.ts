import { useCallback } from 'react'
import { EntityAccessor, useEnvironment } from '@contember/react-binding'
import { RequestParameters, RoutingLinkTarget } from '../types/index.js'
import { createBindingLinkParametersResolver, useBindingLinkParametersResolver } from '../internal/hooks/useBindingLinkParametersResolver.js'
import { useRoutingLinkFactory } from './useRoutingLinkFactory.js'
import { parseLinkTarget } from '../internal/utils/parseLinkTarget.js'

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
