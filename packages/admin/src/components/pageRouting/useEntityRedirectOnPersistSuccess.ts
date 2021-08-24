import type { EntityAccessor, PersistSuccessOptions } from '@contember/binding'
import { useMemo } from 'react'
import { useRedirect } from './useRedirect'
import { RequestState, PageRequest } from '../../state/request'

export type RedirectOnSuccessHandler = (
	currentState: PageRequest<any>,
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
			redirect(request => redirectOnSuccess(request!, getAccessor().id, getAccessor(), options))
		}
	}, [redirectOnSuccess, redirect])
}
