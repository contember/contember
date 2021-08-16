import type { EntityAccessor, PersistSuccessOptions } from '@contember/binding'
import { useMemo } from 'react'
import type RequestState from '../../state/request'
import { useRedirect } from './useRedirect'

export type RedirectOnSuccessHandler = (
	currentState: RequestState,
	persistedId: string,
	entity: EntityAccessor,
	options: PersistSuccessOptions,
) => RequestState

export const useEntityRedirectOnPersistSuccess = (
	redirectOnSuccess:
		| RedirectOnSuccessHandler
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
			redirect(request => redirectOnSuccess(request, getAccessor().id, getAccessor(), options))
		}
	}, [redirectOnSuccess, redirect])
}
