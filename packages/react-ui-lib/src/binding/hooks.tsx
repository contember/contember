import { useCallback } from 'react'
import { dict } from '../dict'
import { ToastContent, useShowToast } from '../toast'
import { ErrorPersistResult, SuccessfulPersistResult, usePersist } from '@contember/interface'
import { useErrorFormatter } from '../errors'

/**
 * A hook `usePersistWithFeedback` that combines persistence with automatic feedback notifications. Triggers data persistence and shows success/error toasts.
 *
 * #### Returns
 * A callback function that triggers persistence with feedback
 *
 * #### Example
 * ```tsx
 * const SaveButton = () => {
 *   const persistWithFeedback = usePersistWithFeedback()
 *
 *   return (
 *     <button onClick={() => persistWithFeedback()}>
 *       Save changes
 *     </button>
 *   )
 * }
 * ```
 */
export const usePersistWithFeedback = () => {
	const triggerPersist = usePersist()
	const { onPersistSuccess } = usePersistFeedbackHandlers()
	return useCallback(() => {
		return triggerPersist()
			.then(onPersistSuccess)
			.catch(() => null)
	}, [onPersistSuccess, triggerPersist])
}

/**
 * A hook `usePersistFeedbackHandlers` that provides handlers for persistence feedback. Currently returns success handler. Used in {@link usePersistWithFeedback}.
 *
 * #### Returns
 * Object containing persistence feedback handlers
 *
 * #### Example
 * ```tsx
 * const { onPersistSuccess } = usePersistFeedbackHandlers()
 *
 * persistData().then(onPersistSuccess)
 * ```
 */
export const usePersistFeedbackHandlers = () => {
	return {
		onPersistSuccess: usePersistSuccessHandler(),
	}
}

/**
 * A hook `usePersistErrorHandler` that handles persistence errors by showing appropriate toast notifications.
 *
 * #### Returns
 * Callback function to handle persistence errors
 *
 * #### Example
 * ```tsx
 * const handleError = usePersistErrorHandler()
 *
 * try {
 *   await persist()
 * } catch (error) {
 *   handleError(error)
 * }
 * ```
 */
export const usePersistErrorHandler = () => {
	const showToast = useShowToast()
	const errorFormatter = useErrorFormatter()
	return useCallback((result: ErrorPersistResult) => {
		if (result.type === 'invalidInput') {
			const errorList = errorFormatter(result.errors)
			showToast(
				<ToastContent
					title={dict.persist.invalidInputError}
					children={<ul>{errorList.map((it, i) => <li key={i}>{it}</li>)}</ul>}
					details={result.response?.errorMessage}
				/>, {
					type: 'error',
				})
		} else if (result.type === 'invalidResponse') {
			showToast(
				<ToastContent
					title={dict.persist.invalidResponseError}
					children={dict.persist.invalidResponseErrorDetails}
				/>, {
					type: 'error',
				},
			)
		}
	}, [errorFormatter, showToast])
}

/**
 * A hook `usePersistSuccessHandler` that handles successful persistence by showing appropriate toast notifications.
 *
 * ### Returns
 * Callback function to handle successful persistence
 *
 * #### Example
 * ```tsx
 * const handleSuccess = usePersistSuccessHandler()
 *
 * persistData().then(result => handleSuccess(result))
 * ```
 */
export const usePersistSuccessHandler = () => {
	const showToast = useShowToast()

	return useCallback((result: SuccessfulPersistResult) => {
		showToast(
			<ToastContent
				title={dict.persist.success}
			/>, {
				type: 'success',
			})
		if (result.type === 'justSuccess' && result.afterPersistError) {
			showToast(
				<ToastContent
					title={dict.persist.afterPersistError}
				/>, {
					type: 'warning',
				})
		}
	}, [showToast])
}
