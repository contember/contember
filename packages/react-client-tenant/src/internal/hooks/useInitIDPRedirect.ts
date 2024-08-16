import { SetStateAction, useCallback } from 'react'
import { useIDPStateStore } from './useIDPStateStore'
import { getBaseHref } from '../utils/getBaseHref'
import { IDPInitError, IDPStateValue } from '../../types/idp'
import { useInitSignInIDPMutation } from '../../hooks'
import { useSaveBacklink } from './useRedirectToBacklink'

export interface UseInitIDPRedirectProps {
	onRedirect?: (url: string) => void
	setState: (state: SetStateAction<IDPStateValue>) => void
}

export const useInitIDPRedirect = ({ onRedirect, setState }: UseInitIDPRedirectProps) => {
	const initRequest = useInitSignInIDPMutation()
	const saveBacklink = useSaveBacklink()
	const { set: saveIdpState } = useIDPStateStore()

	return useCallback(async ({ provider }: { provider: string }): Promise<{ ok: true } | { ok: false; error: IDPInitError }> => {
		const fail = (error: IDPInitError) => {
			setState({ type: 'init_failed', error })
			return { ok: false, error }
		}
		try {
			setState({ type: 'processing_init' })
			const response = await initRequest({
				data: {
					redirectUrl: getBaseHref(),
				},
				identityProvider: provider,
			})
			if (!response.ok) {
				return fail(response.error || 'UNKNOWN_ERROR')
			} else {
				saveIdpState({ provider, sessionData: response.result.sessionData as string })
				saveBacklink()
				if (onRedirect) {
					onRedirect(response.result.authUrl as string)
				} else {
					window.location.href = response.result.authUrl as string
				}
				return { ok: true }
			}
		} catch (e) {
			console.error(e)
			return fail('UNKNOWN_ERROR')
		}
	}, [initRequest, onRedirect, saveBacklink, saveIdpState, setState])
}
