import { PersistTrigger } from '@contember/interface'
import { ReactNode } from 'react'
import { dict } from '../dict'
import { Button } from '../ui/button'
import { Loader } from '../ui/loader'
import { usePersistSuccessHandler } from './hooks'

export const PersistButton = ({ label }: {
	label?: ReactNode
}) => {
	return (
		<PersistTrigger onPersistSuccess={usePersistSuccessHandler()}>
			<Button className="group">
				<Loader size="sm" position="absolute" className="hidden group-data-[loading]:block" />
				{label ?? dict.persist.persistButton}
			</Button>
		</PersistTrigger>
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


const usePersistDebounced = () => {
	const triggerPersist = usePersist()
	const onError = usePersistErrorHandler()
	let persisting = false

	const doPersist = async () => {
		if (persisting) {
			return
		}
		persisting = true
		try {
			await Promise.resolve()
			await triggerPersist().catch(onError)
		} finally {
			persisting = false
		}
	}

	return doPersist
}

export const PersistOnFieldChange = ({ field }: { field: SugaredRelativeSingleField['field'] }) => {
	const doPersist = usePersistDebounced()
	const getField = useField(field).getAccessor

	useEffect(() => {
		return getField().addEventListener({ type: 'update' }, async field => {
			if (field.value === field.valueOnServer) {
				return
			}
			await doPersist()
		})
	}, [getField, doPersist, field])

	return null
}

export const PersistOnRelationChange = ({ field }: { field: SugaredRelativeSingleField['field'] }) => {
	const doPersist = usePersistDebounced()
	const onError = usePersistErrorHandler()
	const getEntity = useEntity().getAccessor

	useEffect(() => {
		const fieldPath = typeof field === 'string' ? field : field.field

		return getEntity().addEventListener({ type: 'connectionUpdate', key: fieldPath }, async () => {
			await doPersist()
		})
	}, [getEntity, onError, doPersist, field])

	return null
}
