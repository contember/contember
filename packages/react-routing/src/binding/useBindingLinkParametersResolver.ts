import { BindingError, EntityAccessor, useEntity, useHasEntity } from '@contember/react-binding'
import { useMemo } from 'react'
import { RoutingParameterResolver } from '../types'
import { PageNotFound } from '../urlMapper'

export const ROUTING_BINDING_PARAMETER_PREFIX = 'entity.'

export const createBindingLinkParametersResolver = (entity: EntityAccessor | undefined): RoutingParameterResolver => {
	return param => {
		if (param.startsWith(ROUTING_BINDING_PARAMETER_PREFIX)) {
			if (!entity) {
				throw new BindingError(`Cannot use data binding routing parameters in non-databinding context`)
			}
			return entity.getField<string>(param.slice(ROUTING_BINDING_PARAMETER_PREFIX.length)).value ?? undefined
		}
		throw new PageNotFound(`Routing parameter ${param} not found`)
	}
}

export const useBindingLinkParametersResolver = (): RoutingParameterResolver => {
	const hasEntity = useHasEntity()
	// eslint-disable-next-line react-hooks/rules-of-hooks
	const entity = hasEntity ? useEntity() : undefined

	return useMemo(
		() => createBindingLinkParametersResolver(entity),
		[entity],
	)
}
