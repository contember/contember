import { ErrorPersistResult, RequestErrorType, SuccessfulPersistResult, useTriggerPersist } from '@contember/binding'
import * as React from 'react'
import { useShowToastWithTimeout } from './useShowToastWithTimeout'

export const useTriggerPersistWithFeedback = () => {
	const triggerPersist = useTriggerPersist()
	const showToast = useShowToastWithTimeout()

	return React.useCallback((): Promise<SuccessfulPersistResult> => {
		if (!triggerPersist) {
			return Promise.reject({
				type: RequestErrorType.UnknownError,
			})
		}

		return triggerPersist()
			.then(result => {
				console.debug('persist success', result)
				showToast({
					type: 'success',
					message: 'Success!',
				})
				return result
			})
			.catch((result: ErrorPersistResult) => {
				console.debug('persist error', result)
				showToast({
					type: 'error',
					message: 'Error!',
				})
				return Promise.reject(result)
			})
	}, [showToast, triggerPersist])
}
