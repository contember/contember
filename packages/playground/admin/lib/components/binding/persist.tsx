import { PersistTrigger, SugaredRelativeSingleField, useField } from '@contember/interface'
import { Button } from '../ui/button'
import { Loader } from '../ui/loader'
import { ReactElement, ReactNode, useCallback, useEffect } from 'react'
import { ToastContent, useShowToast } from '../ui/toast'
import { ErrorPersistResult, SuccessfulPersistResult } from '@contember/binding'
import { Slot } from '@radix-ui/react-slot'
import { useErrorFormatter } from '../errors'
import { usePersist } from '@contember/react-binding'
import { dict } from '../../../lib/dict'

export const FeedbackTrigger = (props: { children: ReactElement }) => {
	return <Slot {...props} {...usePersistFeedbackHandlers()} />
}

export const PersistButton = ({ label }: {
	label?: ReactNode
}) => {
	return (
		<FeedbackTrigger>
			<PersistTrigger>
				<Button className="group">
					<Loader size="sm" position="absolute" className="hidden group-data-[loading]:block" />
					{label ?? dict.persist.persistButton}
				</Button>
			</PersistTrigger>
		</FeedbackTrigger>
	)
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

export const usePersistFeedbackHandlers = () => {
	return {
		onPersistError: usePersistErrorHandler(),
		onPersistSuccess: usePersistSuccessHandler(),
	}
}

export const usePersistWithFeedback = () => {
	const triggerPersist = usePersist()
	const { onPersistSuccess, onPersistError } = usePersistFeedbackHandlers()
	return useCallback(() => {
		return triggerPersist()
			.then(onPersistSuccess)
			.catch(onPersistError)
	}, [onPersistError, onPersistSuccess, triggerPersist])
}

export const PersistOnCmdS = () => {
	const persist = usePersistWithFeedback()
	useEffect(() => {
		const listener = (event: KeyboardEvent) => {
			if (event.ctrlKey && event.key === 's') {
				event.preventDefault()
				persist()
			}
		}
		document.body.addEventListener('keydown', listener)
		return () => document.body.removeEventListener('keydown', listener)
	}, [persist])

	return null
}


export const PersistOnFieldChange = ({ field }: {
	field: SugaredRelativeSingleField['field']
}) => {
	const triggerPersist = usePersist()
	const onError = usePersistErrorHandler()
	const getField = useField(field).getAccessor
	useEffect(() => {
		let persisting = false
		return getField().addEventListener({ type: 'update' }, async field => {
			if (persisting || field.value === field.valueOnServer) {
				return
			}
			persisting = true
			try {
				await Promise.resolve()
				await triggerPersist().catch(onError)
			} finally {
				persisting = false
			}
		})
	}, [getField, onError, triggerPersist])

	return null
}
