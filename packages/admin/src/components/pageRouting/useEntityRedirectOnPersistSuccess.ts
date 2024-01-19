import type { EntityAccessor, EntityId, PersistSuccessOptions } from '@contember/react-binding'
import { useMemo } from 'react'
import { IncompleteRequestState, PageRequest, useCurrentRequest, useLinkFactory } from '../../routing'

export type RedirectOnSuccessHandler = (
	currentState: PageRequest<any>,
	persistedId: EntityId,
	entity: EntityAccessor,
	options: PersistSuccessOptions,
) => IncompleteRequestState | string | undefined

export type RedirectOnSuccessTarget = string | IncompleteRequestState | RedirectOnSuccessHandler

export const useEntityRedirectOnPersistSuccess = (target: RedirectOnSuccessTarget | undefined) => {
	const linkFactory = useLinkFactory()
	const currentRequest = useCurrentRequest()

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

			const link = linkFactory(linkTarget, {}, entity)

			link.navigate()
		}
	}, [currentRequest, linkFactory, target])
}
