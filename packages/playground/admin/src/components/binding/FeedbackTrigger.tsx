import { ReactElement, useCallback } from 'react'
import { ToastContent, useShowToast } from '../ui/toast'
import { ErrorPersistResult, SuccessfulPersistResult } from '@contember/binding'
import { Slot } from '@radix-ui/react-slot'
import { useErrorFormatter } from '../errors'

export const FeedbackTrigger = (props: { children: ReactElement }) => {
	return <Slot {...props} {...useFeedbackTrigger()} />
}

export const usePersistErrorHandler = () => {
	const showToast = useShowToast()
	const errorFormatter = useErrorFormatter()
	return useCallback((result: ErrorPersistResult) => {
		if (result.type === 'invalidInput') {
			const errorList = errorFormatter(result.errors)
			showToast(<ToastContent
				title={'Invalid input'}
				description={<ul>{errorList.map((it, i) => <li key={i}>{it.message}</li>)}</ul>}
			/>, {
				type: 'error',
			})
		} else if (result.type === 'invalidResponse') {
			showToast(<ToastContent
					title={'Invalid response'}
					description={'Server responded with invalid data'}
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
		showToast(<ToastContent
			title={'Successfully saved!'}
		/>, {
			type: 'success',
		})
		if (result.type === 'justSuccess' && result.afterPersistError) {
			showToast(<ToastContent
				title={'Something wrong has happened after the data were persisted. Please refresh the page.'}
			/>, {
				type: 'warning',
			})
		}
	}, [showToast])
}

export const useFeedbackTrigger = () => {
	return {
		onPersistError: usePersistErrorHandler(),
		onPersistSuccess: usePersistSuccessHandler(),
	}
}
