import { QueryLanguage, UnsugarableSingleEntityEventListeners } from '@contember/react-binding'
import { RedirectOnSuccessTarget, useEntityRedirectOnPersistSuccess } from './useEntityRedirectOnPersistSuccess'
import { useMemo } from 'react'

export type UseOnPersistSuccessProps = Pick<UnsugarableSingleEntityEventListeners, 'onPersistSuccess'> & {
	redirectOnSuccess?: RedirectOnSuccessTarget
}

export const useOnPersistSuccess = ({ redirectOnSuccess, onPersistSuccess }: UseOnPersistSuccessProps): UnsugarableSingleEntityEventListeners['onPersistSuccess'] => {
	const redirectOnSuccessCb = useEntityRedirectOnPersistSuccess(redirectOnSuccess)
	return useMemo(() => {
		if (!redirectOnSuccessCb || !onPersistSuccess) {
			return redirectOnSuccessCb ?? onPersistSuccess
		}
		const listeners = QueryLanguage.desugarEventListener(onPersistSuccess)
		listeners.add(redirectOnSuccessCb)
		return listeners
	}, [onPersistSuccess, redirectOnSuccessCb])
}
