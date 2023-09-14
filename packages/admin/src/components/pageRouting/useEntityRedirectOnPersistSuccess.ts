import type { EntityAccessor, EntityId, PersistSuccessOptions } from '@contember/react-binding'
import { useEnvironment } from '@contember/react-binding'
import { useMemo } from 'react'
import {
	createBindingLinkParametersResolver,
	IncompleteRequestState,
	PageRequest,
	parseLinkTarget,
	useCurrentRequest,
	useRoutingLinkFactory,
} from '../../routing'

export type RedirectOnSuccessHandler = (
	currentState: PageRequest<any>,
	persistedId: EntityId,
	entity: EntityAccessor,
	options: PersistSuccessOptions,
) => IncompleteRequestState | string | undefined

export type RedirectOnSuccessTarget = string | IncompleteRequestState | RedirectOnSuccessHandler

export const useEntityRedirectOnPersistSuccess = (target: RedirectOnSuccessTarget | undefined) => {
	const linkFactory = useRoutingLinkFactory()
	const currentRequest = useCurrentRequest()
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
			const linkTarget = typeof target === 'function'
				? target(currentRequest!, entity.id, entity, options)
				: target

			if (!linkTarget) {
				return
			}

			const parsedTarget = parseLinkTarget(linkTarget, env)
			const parameters = {}
			const parametersResolver = createBindingLinkParametersResolver(entity)
			const link = linkFactory(parsedTarget, parameters, parametersResolver)

			link.navigate()
		}
	}, [currentRequest, env, linkFactory, target])
}
