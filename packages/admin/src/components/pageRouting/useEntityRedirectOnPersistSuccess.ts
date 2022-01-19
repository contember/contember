import type { EntityAccessor, PersistSuccessOptions } from '@contember/binding'
import { useMemo } from 'react'
import { IncompleteRequestState, PageNotFound, PageRequest, RoutingParameterResolver, useRedirect } from '../../routing'
import { createBindingLinkParametersResolver, ROUTING_BINDING_PARAMETER_PREFIX } from '../../routing/binding/useBindingLinkParametersResolver'

export type RedirectOnSuccessHandler = (
	currentState: PageRequest<any>,
	persistedId: string,
	entity: EntityAccessor,
	options: PersistSuccessOptions,
) => IncompleteRequestState

export type RedirectOnSuccessTarget = string | IncompleteRequestState | RedirectOnSuccessHandler

export const useEntityRedirectOnPersistSuccess = (redirectOnSuccess: RedirectOnSuccessTarget | undefined) => {
	const redirect = useRedirect()

	return useMemo<EntityAccessor.PersistSuccessHandler | undefined>(() => {
		if (!redirectOnSuccess) {
			return undefined
		}

		return (getAccessor, options) => {
			if (options.successType === 'nothingToPersist') {
				return
			}

			const entity = getAccessor()
			const parameterResolver = createBindingLinkParametersResolver(entity)

			if (typeof redirectOnSuccess === 'function') {
				redirect(request => redirectOnSuccess(request!, entity.id, entity, options), {}, parameterResolver)
				return
			}

			redirect(redirectOnSuccess, {}, parameterResolver)
		}
	}, [redirectOnSuccess, redirect])
}
