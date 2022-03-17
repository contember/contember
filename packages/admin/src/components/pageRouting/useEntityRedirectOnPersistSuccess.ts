import type { EntityAccessor, EntityId, PersistSuccessOptions } from '@contember/binding'
import { useEnvironment } from '@contember/binding'
import { useMemo } from 'react'
import {
	createBindingLinkParametersResolver,
	IncompleteRequestState,
	PageRequest,
	parseLinkTarget,
	RoutingLinkTarget,
	useRoutingLinkFactory,
} from '../../routing'

export type RedirectOnSuccessHandler = (
	currentState: PageRequest<any>,
	persistedId: EntityId,
	entity: EntityAccessor,
	options: PersistSuccessOptions,
) => IncompleteRequestState

export type RedirectOnSuccessTarget = string | IncompleteRequestState | RedirectOnSuccessHandler

export const useEntityRedirectOnPersistSuccess = (target: RedirectOnSuccessTarget | undefined) => {
	const linkFactory = useRoutingLinkFactory()
	const env = useEnvironment()

	return useMemo<EntityAccessor.PersistSuccessHandler | undefined>(() => {
		if (!target) {
			return undefined
		}

		return (getAccessor, options) => {
			if (options.successType === 'nothingToPersist') {
				return
			}

			const entity = getAccessor()
			const linkTarget: RoutingLinkTarget = typeof target === 'function'
				? request => target(request!, entity.id, entity, options)
				: target

			const parsedTarget = parseLinkTarget(linkTarget, env)
			const parameters = {}
			const parametersResolver = createBindingLinkParametersResolver(entity)
			const link = linkFactory(parsedTarget, parameters, parametersResolver)

			link.navigate()
		}
	}, [env, linkFactory, target])
}
