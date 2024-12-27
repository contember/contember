import { useCallback } from 'react'
import { dict } from '../dict'
import { ToastContent, useShowToast } from '../toast'
import { ErrorPersistResult, SuccessfulPersistResult, usePersist } from '@contember/interface'
import { useErrorFormatter } from '../errors'

export const usePersistWithFeedback = () => {
	const triggerPersist = usePersist()
	const { onPersistSuccess } = usePersistFeedbackHandlers()
	return useCallback(() => {
		return triggerPersist()
			.then(onPersistSuccess)
			.catch(() => null)
	}, [onPersistSuccess, triggerPersist])
}


export const usePersistFeedbackHandlers = () => {
	return {
		onPersistSuccess: usePersistSuccessHandler(),
	}
}

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
