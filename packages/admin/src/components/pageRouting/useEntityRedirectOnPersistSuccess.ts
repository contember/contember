import { EntityAccessor, PersistSuccessOptions } from '@contember/binding'
import { useMemo } from 'react'
import RequestState from '../../state/request'
import { useRedirect } from './useRedirect'

export const useEntityRedirectOnPersistSuccess = (
	redirectOnSuccess:
		| ((
				currentState: RequestState,
				persistedId: string,
				entity: EntityAccessor,
				options: PersistSuccessOptions,
		  ) => RequestState)
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
			redirect(request => redirectOnSuccess(request, options.unstable_persistedEntityIds[0], getAccessor(), options))
		}
	}, [redirectOnSuccess, redirect])
}
