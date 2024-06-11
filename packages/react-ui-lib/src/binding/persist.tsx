import { PersistTrigger, SugaredRelativeSingleField, useField } from '@contember/interface'
import { Button } from '../ui/button'
import { Loader } from '../ui/loader'
import { ReactElement, ReactNode, useEffect } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { usePersist } from '@contember/interface'
import { dict } from '../dict'
import { usePersistErrorHandler, usePersistFeedbackHandlers, usePersistWithFeedback } from './hooks'

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
