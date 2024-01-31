import { ErrorPersistResult, PersistTrigger, SuccessfulPersistResult } from '@contember/interface'
import { ToastContent, useShowToast } from '../ui/toast'
import { Button } from '../ui/button'
import { useCallback } from 'react'

export const PersistButton = () => {
	const showToast = useShowToast()

	const errorHandler = useCallback((result: ErrorPersistResult) => {
		if (result.type === 'invalidInput') {
			const errorList = result.errors.map((it, i) => {
				if (it.type === 'validation') {
					return it.message
				} else if (it.type === 'execution') {
					if (it.code === 'UniqueConstraintViolation') {
						return 'Unique constraint violation'
					} else {
						return 'Unknown error'
					}
				}
			})
			showToast(<ToastContent
				title={'Invalid input'}
				description={<ul>{errorList.map((it, i) => <li key={i}>{it}</li>)}</ul>}
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
	}, [showToast])

	const successHandler = useCallback((result: SuccessfulPersistResult) => {
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

	return (
		<PersistTrigger onError={errorHandler} onSuccess={successHandler}>
			<Button size={'lg'}>Save data</Button>
		</PersistTrigger>
	)
}
