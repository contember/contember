import { ErrorPersistResult, PersistOptions, SuccessfulPersistResult, usePersist } from '@contember/binding'
import { useShowToast } from '@contember/ui'
import { useCallback } from 'react'
import { useMessageFormatter } from '../../i18n'
import { useAccessorErrorFormatter } from '../bindingFacade/errors'
import { persistFeedbackDictionary } from './persistFeedbackDictionary'

export interface PersistWithFeedbackOptions extends PersistOptions {
	successMessage?: string
	successDuration?: number

	errorMessage?: string
	errorDuration?: number

	afterPersistErrorMessage?: string
	afterPersistErrorDuration?: number
}

export const usePersistWithFeedback = ({
	successMessage,
	successDuration,
	errorMessage,
	errorDuration,
	afterPersistErrorMessage,
	afterPersistErrorDuration,
	...persistOptions
}: PersistWithFeedbackOptions = {}) => {
	const persistAll = usePersist()
	const showToast = useShowToast()
	const formatMessage = useMessageFormatter(persistFeedbackDictionary)
	const errorFormatter = useAccessorErrorFormatter()

	return useCallback((): Promise<SuccessfulPersistResult> => {
		return persistAll(persistOptions)
			.then(result => {
				console.debug('persist success', result)
				showToast(
					{
						type: 'success',
						message: formatMessage(successMessage, 'persistFeedback.successMessage'),
						dismiss: successDuration ?? true,
					},
				)
				if (result.type === 'justSuccess' && result.afterPersistError) {
					showToast(
						{
							type: 'error',
							message: formatMessage(afterPersistErrorMessage, 'persistFeedback.afterPersistErrorMessage'),
							dismiss: afterPersistErrorDuration ?? true,
						},
					)
				}
				return result
			})
			.catch((result: ErrorPersistResult) => {
				console.debug('persist error', result)
				if (result.type === 'invalidInput' && result.errors.length) {
					showToast(
						{
							type: 'error',
							message: <>
								{formatMessage(errorMessage, 'persistFeedback.errorMessage')}
								<ul>
									{errorFormatter(result.errors).map((it, i) => <li key={i}>{it.message}</li>)}
								</ul>
							</>,
							dismiss: errorDuration ?? true,
						},
					)
				} else {
					showToast(
						{
							type: 'error',
							message: formatMessage(errorMessage, 'persistFeedback.errorMessage'),
							dismiss: errorDuration ?? true,
						},
					)
				}
				return Promise.reject(result)
			})
	}, [persistAll, persistOptions, showToast, formatMessage, successMessage, successDuration, afterPersistErrorMessage, afterPersistErrorDuration, errorFormatter, errorMessage, errorDuration])
}
