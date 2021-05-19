import { ErrorPersistResult, PersistOptions, SuccessfulPersistResult, usePersist } from '@contember/binding'
import { useCallback } from 'react'
import { useMessageFormatter } from '../../i18n'
import { persistFeedbackDictionary } from './persistFeedbackDictionary'
import { useShowToastWithTimeout } from './useShowToastWithTimeout'

export interface PersistWithFeedbackOptions extends PersistOptions {
	successMessage?: string
	successDuration?: number

	errorMessage?: string
	errorDuration?: number
}

export const usePersistWithFeedback = ({
	successMessage,
	successDuration,
	errorMessage,
	errorDuration,
	...persistOptions
}: PersistWithFeedbackOptions = {}) => {
	const persistAll = usePersist()
	const showToast = useShowToastWithTimeout()
	const formatMessage = useMessageFormatter(persistFeedbackDictionary)

	return useCallback((): Promise<SuccessfulPersistResult> => {
		return persistAll(persistOptions)
			.then(result => {
				console.debug('persist success', result)
				showToast(
					{
						type: 'success',
						message: formatMessage(successMessage, 'persistFeedback.successMessage'),
					},
					successDuration ?? 4000,
				)
				return result
			})
			.catch((result: ErrorPersistResult) => {
				console.debug('persist error', result)
				showToast(
					{
						type: 'error',
						message: formatMessage(errorMessage, 'persistFeedback.errorMessage'),
					},
					errorDuration ?? 8000,
				)
				return Promise.reject(result)
			})
	}, [
		persistAll,
		persistOptions,
		showToast,
		formatMessage,
		successMessage,
		successDuration,
		errorMessage,
		errorDuration,
	])
}
