import { EntityAccessor } from '@contember/binding'
import { useMemo } from 'react'
import RequestState from '../../state/request'
import { useRedirect } from './useRedirect'

export const useEntityRedirectOnPersistSuccess = (
	redirectOnSuccess:
		| ((currentState: RequestState, persistedId: string, entity: EntityAccessor) => RequestState)
		| undefined,
) => {
	const redirect = useRedirect()

	return useMemo<EntityAccessor.PersistSuccessHandler | undefined>(() => {
		if (!redirectOnSuccess) {
			return undefined
		}
		return (getAccessor, options) => {
			if (options.successType === 'nothingToPersist') {
				return
			}
			redirect(request => redirectOnSuccess(request, options.unstable_persistedEntityIds[0], getAccessor()))
		}
	}, [redirectOnSuccess, redirect])
}
