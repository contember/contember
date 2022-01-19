import type { EntityAccessor, PersistSuccessOptions } from '@contember/binding'
import { useMemo } from 'react'
import { IncompleteRequestState, PageRequest, useRedirect } from '../../routing'

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

			if (typeof redirectOnSuccess === 'function') {
				redirect(request => redirectOnSuccess(request!, getAccessor().id, getAccessor(), options), { id: getAccessor().id })
				return
			}

			redirect(redirectOnSuccess, { id: getAccessor().id })
		}
	}, [redirectOnSuccess, redirect])
}
